import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Star } from 'lucide-react';
import { useDailyQuestSlots, DailyQuestSlot } from '@/hooks/useDailyQuestSlots';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DailyQuestCompletionModal from './DailyQuestCompletionModal';
import QuestSlotCard from './QuestSlotCard';
import { getEffectiveGameDate } from '@/utils/gameDate';

interface DailyQuestSlotsProps {
  onQuestComplete?: () => void;
  isAdminView?: boolean;
  onRemoveAssignment?: (questId: string) => void;
}

interface SlotCompletionStatus {
  questId: string;
  status: 'pending' | 'verified' | 'rejected' | null;
}

const DailyQuestSlots: React.FC<DailyQuestSlotsProps> = ({ onQuestComplete, isAdminView = false, onRemoveAssignment }) => {
  const { user } = useAuth();
  const { slots, isLoading, isRerolling, rerollSlot, refetch } = useDailyQuestSlots();
  const { refetch: gamificationRefetch } = useGamification();
  const [selectedSlot, setSelectedSlot] = useState<DailyQuestSlot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [completionStatuses, setCompletionStatuses] = useState<SlotCompletionStatus[]>([]);

  const today = getEffectiveGameDate();

  // Fetch completion statuses for today's daily quests
  // We need to check both admin assignments AND personal assignments (for re-rolled quests)
  useEffect(() => {
    const fetchCompletionStatuses = async () => {
      if (!user || slots.length === 0) return;

      const questIds = slots.map(s => s.quest_id);
      
      // Get all quest assignments for today's daily quests (both admin and personal)
      const { data: assignments } = await supabase
        .from('gamification_quest_assignments')
        .select('id, quest_id, assigned_by')
        .in('quest_id', questIds)
        .lte('start_date', today)
        .gte('end_date', today);

      if (!assignments || assignments.length === 0) {
        setCompletionStatuses([]);
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
        setCompletionStatuses([]);
        return;
      }

      // Get completions for this user on these assignments
      const { data: completions } = await supabase
        .from('gamification_quest_completions')
        .select('quest_assignment_id, status')
        .eq('chatter_id', user.id)
        .in('quest_assignment_id', assignmentIds);

      // Map quest_id to status
      const statuses: SlotCompletionStatus[] = questIds.map(questId => {
        const assignmentId = questAssignmentMap.get(questId);
        if (!assignmentId) return { questId, status: null };
        
        const completion = completions?.find(c => c.quest_assignment_id === assignmentId);
        return { 
          questId, 
          status: completion?.status as 'pending' | 'verified' | 'rejected' | null 
        };
      });

      setCompletionStatuses(statuses);
    };

    fetchCompletionStatuses();
  }, [user, slots, today]);

  const getSlotStatus = (slot: DailyQuestSlot) => {
    const statusEntry = completionStatuses.find(s => s.questId === slot.quest_id);
    return statusEntry?.status || null;
  };

  const handleViewQuest = (slot: DailyQuestSlot) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const handleSubmitComplete = async () => {
    gamificationRefetch.myCompletions();
    refetch();
    onQuestComplete?.();
    // Re-fetch completion statuses (same logic as useEffect above)
    if (user && slots.length > 0) {
      const questIds = slots.map(s => s.quest_id);
      const { data: assignments } = await supabase
        .from('gamification_quest_assignments')
        .select('id, quest_id, assigned_by')
        .in('quest_id', questIds)
        .lte('start_date', today)
        .gte('end_date', today);

      if (assignments && assignments.length > 0) {
        // For each quest, prefer admin assignment if exists, else use personal assignment
        const questAssignmentMap = new Map<string, string>();
        for (const qId of questIds) {
          const adminAssignment = assignments.find(a => a.quest_id === qId && a.assigned_by === null);
          if (adminAssignment) {
            questAssignmentMap.set(qId, adminAssignment.id);
            continue;
          }
          const personalAssignment = assignments.find(a => a.quest_id === qId && a.assigned_by === user.id);
          if (personalAssignment) {
            questAssignmentMap.set(qId, personalAssignment.id);
          }
        }

        const assignmentIds = Array.from(questAssignmentMap.values());
        const { data: completions } = await supabase
          .from('gamification_quest_completions')
          .select('quest_assignment_id, status')
          .eq('chatter_id', user.id)
          .in('quest_assignment_id', assignmentIds);

        const statuses: SlotCompletionStatus[] = questIds.map(questId => {
          const assignmentId = questAssignmentMap.get(questId);
          if (!assignmentId) return { questId, status: null };
          const completion = completions?.find(c => c.quest_assignment_id === assignmentId);
          return { questId, status: completion?.status as 'pending' | 'verified' | 'rejected' | null };
        });
        setCompletionStatuses(statuses);
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (slots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Your Daily Quests
          </CardTitle>
          <CardDescription>
            No daily quests available. Check back when an admin adds daily quests!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const completedCount = slots.filter(s => getSlotStatus(s) === 'verified').length;

  return (
    <>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 
              className="text-xl font-bold flex items-center gap-2"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              <Star className="h-5 w-5 text-yellow-500" />
              Your Daily Quests
            </h2>
          <p className="text-sm text-muted-foreground">
            Complete up to 4 quests daily • Re-roll once each
          </p>
        </div>
        <Badge 
          variant="outline" 
          className="text-base px-3 py-1 border-primary/30 font-bold"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          {completedCount}/{slots.length || 4}
        </Badge>
        </div>

        {/* Quest Cards Grid - 2 columns for daily quests (max 4) */}
        <div className="grid gap-3 sm:grid-cols-2">
          {slots.map((slot) => (
            <QuestSlotCard
              key={slot.id}
              quest={slot.quest}
              questType="daily"
              status={getSlotStatus(slot)}
              hasRerolled={slot.has_rerolled}
              isRerolling={isRerolling === slot.slot_number}
              onReroll={isAdminView ? undefined : () => rerollSlot(slot.slot_number)}
              onViewQuest={() => handleViewQuest(slot)}
              isAdminView={isAdminView}
              onRemoveAssignment={isAdminView && onRemoveAssignment ? () => onRemoveAssignment(slot.quest_id) : undefined}
            />
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          🎲 Click the dice to re-roll a quest (once per quest, per day)
        </p>
      </div>

      {/* Daily Quest Completion Modal */}
      {selectedSlot && (
        <DailyQuestCompletionModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          slot={selectedSlot}
          onSubmitComplete={handleSubmitComplete}
        />
      )}
    </>
  );
};

export default DailyQuestSlots;
