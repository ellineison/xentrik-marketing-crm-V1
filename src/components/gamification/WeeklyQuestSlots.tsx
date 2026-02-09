import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Medal } from 'lucide-react';
import { useWeeklyQuestSlots, WeeklyQuestSlot } from '@/hooks/useWeeklyQuestSlots';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import WeeklyQuestCompletionModal from './WeeklyQuestCompletionModal';
import QuestSlotCard from './QuestSlotCard';
import { format, startOfWeek, endOfWeek } from 'date-fns';

interface WeeklyQuestSlotsProps {
  onQuestComplete?: () => void;
  isAdminView?: boolean;
  onRemoveAssignment?: (questId: string) => void;
}

interface SlotCompletionStatus {
  questId: string;
  status: 'pending' | 'verified' | 'rejected' | null;
}

const WeeklyQuestSlots: React.FC<WeeklyQuestSlotsProps> = ({ onQuestComplete, isAdminView = false, onRemoveAssignment }) => {
  const { user } = useAuth();
  const { slots, isLoading, isRerolling, rerollSlot, refetch } = useWeeklyQuestSlots();
  const { refetch: gamificationRefetch } = useGamification();
  const [selectedSlot, setSelectedSlot] = useState<WeeklyQuestSlot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [completionStatuses, setCompletionStatuses] = useState<SlotCompletionStatus[]>([]);

  const today = new Date();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  // Fetch completion statuses for weekly quests
  useEffect(() => {
    const fetchCompletionStatuses = async () => {
      if (!user || slots.length === 0) return;

      const questIds = slots.map(s => s.quest_id);
      
      // Get all quest assignments for this week's quests
      const { data: assignments } = await supabase
        .from('gamification_quest_assignments')
        .select('id, quest_id')
        .in('quest_id', questIds)
        .lte('start_date', weekEnd)
        .gte('end_date', weekStart);

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
  }, [user, slots, weekStart, weekEnd]);

  const getSlotStatus = (slot: WeeklyQuestSlot) => {
    const statusEntry = completionStatuses.find(s => s.questId === slot.quest_id);
    return statusEntry?.status || null;
  };

  const handleViewQuest = (slot: WeeklyQuestSlot) => {
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
        .lte('start_date', weekEnd)
        .gte('end_date', weekStart);

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
            <Medal className="h-5 w-5 text-blue-500" />
            Your Weekly Quests
          </CardTitle>
          <CardDescription>
            No weekly quests available. Check back when an admin adds weekly quests!
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
              <Medal className="h-5 w-5 text-blue-500" />
              Your Weekly Quests
            </h2>
            <p className="text-sm text-muted-foreground">
              {format(new Date(weekStart), 'MMM d')} - {format(new Date(weekEnd), 'MMM d')} • Re-roll once per week
            </p>
          </div>
          <Badge 
            variant="outline" 
            className="text-base px-3 py-1 border-blue-500/30 font-bold"
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
              questType="weekly"
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
          🎲 Click the dice to re-roll this quest (once per week)
        </p>
      </div>

      {/* Weekly Quest Completion Modal */}
      {selectedSlot && (
        <WeeklyQuestCompletionModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          slot={selectedSlot}
          onSubmitComplete={handleSubmitComplete}
        />
      )}
    </>
  );
};

export default WeeklyQuestSlots;
