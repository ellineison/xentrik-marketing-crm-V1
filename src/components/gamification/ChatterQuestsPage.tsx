import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Trophy, Medal, Crown, Swords } from 'lucide-react';
import { useGamification, QuestAssignment } from '@/hooks/useGamification';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import QuestDetailsModal from './QuestDetailsModal';
import QuestSlotCard from './QuestSlotCard';
import { useDailyQuestSlots } from '@/hooks/useDailyQuestSlots';
import { useWeeklyQuestSlots } from '@/hooks/useWeeklyQuestSlots';
import { useMonthlyQuestSlots } from '@/hooks/useMonthlyQuestSlots';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

type QuestType = 'daily' | 'weekly' | 'monthly';

type CompletionStatus = 'pending' | 'verified' | 'rejected' | null;

interface SlotStatus {
  questId: string;
  status: CompletionStatus;
}

const ChatterQuestsPage: React.FC = () => {
  const { user } = useAuth();
  const { myCompletions, isLoading, refetch } = useGamification();

  // Per-user quest sources (support per-player re-roll without affecting others)
  const daily = useDailyQuestSlots();
  const weekly = useWeeklyQuestSlots();
  const monthly = useMonthlyQuestSlots();

  const [activeTab, setActiveTab] = useState<QuestType>('daily');
  const [selectedAssignment, setSelectedAssignment] = useState<QuestAssignment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [slotStatuses, setSlotStatuses] = useState<Record<string, CompletionStatus>>({});
  const [slotProgress, setSlotProgress] = useState<Record<string, number>>({});

  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const weekStart = useMemo(() => format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'), []);
  const weekEnd = useMemo(() => format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'), []);
  const monthStart = useMemo(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'), []);
  const monthEnd = useMemo(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'), []);

  const allSlots = useMemo(() => {
    return {
      daily: daily.slots,
      weekly: weekly.slots,
      monthly: monthly.slots,
    } as const;
  }, [daily.slots, weekly.slots, monthly.slots]);

  const activeSlots = allSlots[activeTab];

  // Fetch completion statuses for all currently shown slots
  // We need to find both admin assignments AND personal assignments (for re-rolled quests)
  const refreshSlotStatuses = async () => {
    if (!user) return;

    const questIds = [
      ...daily.slots.map(s => s.quest_id),
      ...weekly.slots.map(s => s.quest_id),
      ...monthly.slots.map(s => s.quest_id),
    ].filter(Boolean);

    if (questIds.length === 0) {
      setSlotStatuses({});
      return;
    }

    // Find all assignments (both admin and personal) for the user's quests that are active today
    // Admin assignments have assigned_by = null, personal ones have assigned_by = user.id
    const { data: assignments, error: aErr } = await supabase
      .from('gamification_quest_assignments')
      .select('id, quest_id, assigned_by')
      .in('quest_id', questIds)
      .lte('start_date', today)
      .gte('end_date', today);

    if (aErr) {
      console.error('Error fetching quest assignments for status:', aErr);
      return;
    }

    if (!assignments || assignments.length === 0) {
      setSlotStatuses({});
      return;
    }

    // For each quest, prefer admin assignment if exists, else use personal assignment
    const questAssignmentMap = new Map<string, string>();
    for (const qId of questIds) {
      // Find admin assignment first (assigned_by is null)
      const adminAssignment = assignments.find(a => a.quest_id === qId && a.assigned_by === null);
      if (adminAssignment) {
        questAssignmentMap.set(qId, adminAssignment.id);
        continue;
      }
      // Fall back to personal assignment (assigned_by = user.id)
      const personalAssignment = assignments.find(a => a.quest_id === qId && a.assigned_by === user.id);
      if (personalAssignment) {
        questAssignmentMap.set(qId, personalAssignment.id);
      }
    }

    const assignmentIds = Array.from(questAssignmentMap.values());

    if (assignmentIds.length === 0) {
      setSlotStatuses({});
      setSlotProgress({});
      return;
    }

    // Fetch completions and progress in parallel
    const [completionsResult, progressResult] = await Promise.all([
      supabase
        .from('gamification_quest_completions')
        .select('quest_assignment_id, status')
        .eq('chatter_id', user.id)
        .in('quest_assignment_id', assignmentIds),
      supabase
        .from('gamification_quest_progress')
        .select('quest_assignment_id')
        .eq('chatter_id', user.id)
        .in('quest_assignment_id', assignmentIds)
    ]);

    if (completionsResult.error) {
      console.error('Error fetching completions for status:', completionsResult.error);
      return;
    }

    const completions = completionsResult.data;
    const progressData = progressResult.data || [];

    const statusMap: Record<string, CompletionStatus> = {};
    const progressMap: Record<string, number> = {};

    for (const qId of questIds) {
      const assignmentId = questAssignmentMap.get(qId);
      if (!assignmentId) {
        statusMap[qId] = null;
        progressMap[qId] = 0;
        continue;
      }
      const completion = completions?.find(c => c.quest_assignment_id === assignmentId);
      statusMap[qId] = (completion?.status as CompletionStatus) ?? null;
      
      // Count progress uploads for this assignment
      progressMap[qId] = progressData.filter(p => p.quest_assignment_id === assignmentId).length;
    }

    setSlotStatuses(statusMap);
    setSlotProgress(progressMap);
  };

  useEffect(() => {
    refreshSlotStatuses();
  }, [user, today, daily.slots, weekly.slots, monthly.slots]);

  const getSlotStatus = (questId: string): CompletionStatus => {
    return slotStatuses[questId] ?? null;
  };

  const getSlotProgress = (questId: string): number => {
    return slotProgress[questId] ?? 0;
  };

  // Find or create a user-scoped assignment for tracking progress and completion.
  // CRITICAL: We create "personal" assignments that are isolated per-user.
  // These are identified by having assigned_by = user.id (not null/admin ID).
  // Re-rolled quests get their own personal assignments that don't affect other players.
  const ensureAssignmentForQuest = async (questId: string, questType: QuestType) => {
    if (!user) return null;

    const period = (() => {
      if (questType === 'daily') return { start: today, end: today };
      if (questType === 'weekly') return { start: weekStart, end: weekEnd };
      return { start: monthStart, end: monthEnd };
    })();

    // First, check if user already has a personal assignment for this quest
    // Personal assignments have assigned_by = user.id
    const { data: personalAssignment, error: pErr } = await supabase
      .from('gamification_quest_assignments')
      .select(`*, quest:gamification_quests (*)`)
      .eq('quest_id', questId)
      .eq('start_date', period.start)
      .eq('end_date', period.end)
      .eq('assigned_by', user.id)
      .maybeSingle();

    if (pErr) {
      console.error('Error looking up personal assignment:', pErr);
    }

    if (personalAssignment?.id) {
      return personalAssignment as any as QuestAssignment;
    }

    // Next, check for an admin-created assignment (assigned_by is null or different user)
    const { data: adminAssignment, error: aErr } = await supabase
      .from('gamification_quest_assignments')
      .select(`*, quest:gamification_quests (*)`)
      .eq('quest_id', questId)
      .eq('start_date', period.start)
      .eq('end_date', period.end)
      .is('assigned_by', null)
      .maybeSingle();

    if (aErr) {
      console.error('Error looking up admin assignment:', aErr);
    }

    // If admin assignment exists, use it (this is the normal case for non-rerolled quests)
    if (adminAssignment?.id) {
      return adminAssignment as any as QuestAssignment;
    }

    // No admin assignment exists - this quest was obtained via re-roll.
    // Create a PERSONAL assignment for this user only.
    // Other players won't see this because it has assigned_by = user.id
    const { data: created, error: cErr } = await supabase
      .from('gamification_quest_assignments')
      .insert({
        quest_id: questId,
        start_date: period.start,
        end_date: period.end,
        assigned_by: user.id, // Mark as personal assignment
      })
      .select(`*, quest:gamification_quests (*)`)
      .single();

    if (cErr) {
      console.error('Error creating personal assignment:', cErr);
      return null;
    }

    return created as any as QuestAssignment;
  };

  const handleViewQuest = async (questId: string, questType: QuestType) => {
    const assignment = await ensureAssignmentForQuest(questId, questType);
    if (!assignment) return;

    setSelectedAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleQuestComplete = () => {
    refetch.myCompletions();
    refetch.activeAssignments();
    refetch.myProgress();

    // Also refresh slot status map
    daily.refetch();
    weekly.refetch();
    monthly.refetch();
    
    // Force refresh statuses after state updates
    setTimeout(() => refreshSlotStatuses(), 100);
  };

  const dailyStats = {
    total: daily.slots.length,
    completed: daily.slots.filter(s => getSlotStatus(s.quest_id) === 'verified').length,
  };

  const weeklyStats = {
    total: weekly.slots.length,
    completed: weekly.slots.filter(s => getSlotStatus(s.quest_id) === 'verified').length,
  };

  const monthlyStats = {
    total: monthly.slots.length,
    completed: monthly.slots.filter(s => getSlotStatus(s.quest_id) === 'verified').length,
  };

  if (isLoading || daily.isLoading || weekly.isLoading || monthly.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>Loading quests...</span>
      </div>
    );
  }

  const renderSlotCards = (questType: QuestType) => {
    const slots = allSlots[questType];

    if (slots.length === 0) {
      return (
        <Card className="bg-card/80 border-border/50 col-span-full">
          <CardContent className="p-12 text-center">
            <Swords className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg">No quests available in this category.</p>
            <p className="text-muted-foreground text-sm mt-1">Check back later for new missions!</p>
          </CardContent>
        </Card>
      );
    }

    return slots.map((slot) => {
      const status = getSlotStatus(slot.quest_id);
      const isRerolling = questType === 'daily'
        ? daily.isRerolling === slot.slot_number
        : questType === 'weekly'
          ? weekly.isRerolling
          : monthly.isRerolling;

      const handleReroll = async () => {
        const rerollFn = questType === 'daily'
          ? () => daily.rerollSlot(slot.slot_number)
          : questType === 'weekly'
            ? () => weekly.rerollSlot()
            : () => monthly.rerollSlot();
        
        const success = await rerollFn();
        if (success) {
          // After successful re-roll, refresh slot statuses so Log Activity works correctly
          setTimeout(() => refreshSlotStatuses(), 100);
        }
      };

      return (
        <QuestSlotCard
          key={slot.id}
          quest={slot.quest}
          questType={questType}
          status={status}
          currentProgress={getSlotProgress(slot.quest_id)}
          hasRerolled={slot.has_rerolled}
          isRerolling={isRerolling}
          onReroll={handleReroll}
          onViewQuest={() => handleViewQuest(slot.quest_id, questType)}
          isAdminView={false}
        />
      );
    });
  };

  return (
    <div className="space-y-6" style={{ fontFamily: "'Orbitron', sans-serif" }}>
      {/* Header */}
      <div>
        <h1 
          className="text-4xl font-bold text-foreground uppercase tracking-wide flex items-center gap-3"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          <Swords className="h-9 w-9 text-primary" />
          Active Quests
        </h1>
        <p className="text-muted-foreground text-base mt-1">
          Complete missions to earn XP and Bananas.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as QuestType)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card/80 border border-border/50 h-auto p-1">
          <TabsTrigger 
            value="daily" 
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/50 flex items-center gap-2 py-3"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            <Trophy className="h-4 w-4" />
            <span>Daily</span>
            <Badge variant="outline" className="ml-1 text-xs bg-background/50">
              {dailyStats.completed}/{dailyStats.total}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="weekly" 
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/50 flex items-center gap-2 py-3"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            <Medal className="h-4 w-4" />
            <span>Weekly</span>
            <Badge variant="outline" className="ml-1 text-xs bg-background/50">
              {weeklyStats.completed}/{weeklyStats.total}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="monthly" 
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/50 flex items-center gap-2 py-3"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            <Crown className="h-4 w-4" />
            <span>Special Ops</span>
            <Badge variant="outline" className="ml-1 text-xs bg-background/50">
              {monthlyStats.completed}/{monthlyStats.total}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {renderSlotCards('daily')}
          </div>
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
          <div className="grid grid-cols-1 gap-3">
            {renderSlotCards('weekly')}
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="mt-6">
          <div className="grid grid-cols-1 gap-3">
            {renderSlotCards('monthly')}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quest Details Modal */}
      {selectedAssignment && (
        <QuestDetailsModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          assignment={selectedAssignment}
          completionStatus={myCompletions.find(c => c.quest_assignment_id === selectedAssignment.id)?.status || null}
          onSubmitComplete={handleQuestComplete}
        />
      )}
    </div>
  );
};

export default ChatterQuestsPage;
