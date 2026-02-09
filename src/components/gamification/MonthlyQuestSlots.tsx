import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crown } from 'lucide-react';
import { useMonthlyQuestSlots, MonthlyQuestSlot } from '@/hooks/useMonthlyQuestSlots';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import MonthlyQuestCompletionModal from './MonthlyQuestCompletionModal';
import QuestSlotCard from './QuestSlotCard';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface MonthlyQuestSlotsProps {
  onQuestComplete?: () => void;
  isAdminView?: boolean;
  onRemoveAssignment?: (questId: string) => void;
}

interface SlotCompletionStatus {
  questId: string;
  status: 'pending' | 'verified' | 'rejected' | null;
}

const MonthlyQuestSlots: React.FC<MonthlyQuestSlotsProps> = ({ onQuestComplete, isAdminView = false, onRemoveAssignment }) => {
  const { user } = useAuth();
  const { slots, isLoading, isRerolling, rerollSlot, refetch } = useMonthlyQuestSlots();
  const { refetch: gamificationRefetch } = useGamification();
  const [selectedSlot, setSelectedSlot] = useState<MonthlyQuestSlot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [completionStatuses, setCompletionStatuses] = useState<SlotCompletionStatus[]>([]);

  const today = new Date();
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');

  // Fetch completion statuses for monthly quests
  useEffect(() => {
    const fetchCompletionStatuses = async () => {
      if (!user || slots.length === 0) return;

      const questIds = slots.map(s => s.quest_id);
      
      // Get all quest assignments for this month's quests
      const { data: assignments } = await supabase
        .from('gamification_quest_assignments')
        .select('id, quest_id')
        .in('quest_id', questIds)
        .lte('start_date', monthEnd)
        .gte('end_date', monthStart);

      if (!assignments || assignments.length === 0) {
        setCompletionStatuses([]);
        return;
      }

      const assignmentIds = assignments.map(a => a.id);

      // Get completions for this user on these assignments
      const { data: completions } = await supabase
        .from('gamification_quest_completions')
        .select('quest_assignment_id, status')
        .eq('chatter_id', user.id)
        .in('quest_assignment_id', assignmentIds);

      // Map quest_id to status
      const statuses: SlotCompletionStatus[] = questIds.map(questId => {
        const assignment = assignments.find(a => a.quest_id === questId);
        if (!assignment) return { questId, status: null };
        
        const completion = completions?.find(c => c.quest_assignment_id === assignment.id);
        return { 
          questId, 
          status: completion?.status as 'pending' | 'verified' | 'rejected' | null 
        };
      });

      setCompletionStatuses(statuses);
    };

    fetchCompletionStatuses();
  }, [user, slots, monthStart, monthEnd]);

  const getSlotStatus = (slot: MonthlyQuestSlot) => {
    const statusEntry = completionStatuses.find(s => s.questId === slot.quest_id);
    return statusEntry?.status || null;
  };

  const handleViewQuest = (slot: MonthlyQuestSlot) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const handleSubmitComplete = async () => {
    gamificationRefetch.myCompletions();
    refetch();
    onQuestComplete?.();
    
    // Re-fetch completion statuses
    if (user && slots.length > 0) {
      const questIds = slots.map(s => s.quest_id);
      const { data: assignments } = await supabase
        .from('gamification_quest_assignments')
        .select('id, quest_id')
        .in('quest_id', questIds)
        .lte('start_date', monthEnd)
        .gte('end_date', monthStart);

      if (assignments && assignments.length > 0) {
        const assignmentIds = assignments.map(a => a.id);
        const { data: completions } = await supabase
          .from('gamification_quest_completions')
          .select('quest_assignment_id, status')
          .eq('chatter_id', user.id)
          .in('quest_assignment_id', assignmentIds);

        const statuses: SlotCompletionStatus[] = questIds.map(questId => {
          const assignment = assignments.find(a => a.quest_id === questId);
          if (!assignment) return { questId, status: null };
          const completion = completions?.find(c => c.quest_assignment_id === assignment.id);
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
            <Crown className="h-5 w-5 text-purple-500" />
            Special Ops
          </CardTitle>
          <CardDescription>
            No special ops available. Check back when an admin adds monthly quests!
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
              <Crown className="h-5 w-5 text-purple-500" />
              Special Ops
            </h2>
            <p className="text-sm text-muted-foreground">
              {format(new Date(monthStart), 'MMMM yyyy')} • Re-roll once per month
            </p>
          </div>
          <Badge 
            variant="outline" 
            className="text-base px-3 py-1 border-purple-500/30 font-bold"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            {completedCount}/{slots.length}
          </Badge>
        </div>

        {/* Quest Cards */}
        <div className="grid gap-3">
          {slots.map((slot) => (
            <QuestSlotCard
              key={slot.id}
              quest={slot.quest}
              questType="monthly"
              status={getSlotStatus(slot)}
              hasRerolled={slot.has_rerolled}
              isRerolling={isRerolling}
              onReroll={isAdminView ? undefined : () => rerollSlot()}
              onViewQuest={() => handleViewQuest(slot)}
              isAdminView={isAdminView}
              onRemoveAssignment={isAdminView && onRemoveAssignment ? () => onRemoveAssignment(slot.quest_id) : undefined}
            />
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          🎲 Click the dice to re-roll this quest (once per month)
        </p>
      </div>

      {/* Monthly Quest Completion Modal */}
      {selectedSlot && (
        <MonthlyQuestCompletionModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          slot={selectedSlot}
          onSubmitComplete={handleSubmitComplete}
        />
      )}
    </>
  );
};

export default MonthlyQuestSlots;
