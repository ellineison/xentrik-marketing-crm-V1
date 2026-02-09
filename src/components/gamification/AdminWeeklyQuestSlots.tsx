import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Medal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import QuestSlotCard from './QuestSlotCard';
import { Quest } from '@/hooks/useGamification';
import { format, startOfWeek, endOfWeek } from 'date-fns';

interface AdminWeeklyQuestSlotsProps {
  onRemoveAssignment?: (questId: string) => void;
}

interface AdminAssignment {
  id: string;
  quest_id: string;
  start_date: string;
  end_date: string;
  quest?: Quest;
}

const AdminWeeklyQuestSlots: React.FC<AdminWeeklyQuestSlotsProps> = ({ onRemoveAssignment }) => {
  const [assignments, setAssignments] = useState<AdminAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date();
  const weekStartDate = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEndDate = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const todayStr = format(today, 'yyyy-MM-dd');

  // Fetch ADMIN-assigned weekly quests (assigned_by IS NULL)
  useEffect(() => {
    const fetchAdminAssignments = async () => {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('gamification_quest_assignments')
        .select(`
          id,
          quest_id,
          start_date,
          end_date,
          quest:gamification_quests (*)
        `)
        .lte('start_date', todayStr)
        .gte('end_date', todayStr)
        .is('assigned_by', null);

      if (error) {
        console.error('Error fetching admin weekly assignments:', error);
      }

      // Filter to only weekly quests
      const weeklyAssignments = (data || []).filter(
        (a: any) => a.quest?.quest_type === 'weekly'
      );

      setAssignments(weeklyAssignments as AdminAssignment[]);
      setIsLoading(false);
    };

    fetchAdminAssignments();
  }, [todayStr]);

  if (isLoading) {
    return (
      <Card>
        <div className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Medal className="h-5 w-5 text-blue-500" />
            Weekly Quests
          </CardTitle>
          <CardDescription>
            No weekly quest assigned for this week. Use "Assign Quest" to add 1 weekly quest.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Medal className="h-5 w-5 text-blue-500" />
            Weekly Quests
          </h2>
          <p className="text-sm text-muted-foreground">
            {format(new Date(weekStartDate), 'MMM d')} - {format(new Date(weekEndDate), 'MMM d')}
          </p>
        </div>
        <Badge variant="outline" className="text-base px-3 py-1 border-blue-500/30 font-bold">
          {assignments.length}/1
        </Badge>
      </div>

      {/* Quest Cards */}
      <div className="grid gap-3">
        {assignments.map((assignment) => (
          <QuestSlotCard
            key={assignment.id}
            quest={assignment.quest}
            questType="weekly"
            status={null}
            hasRerolled={false}
            isRerolling={false}
            isAdminView={true}
            onRemoveAssignment={onRemoveAssignment ? () => onRemoveAssignment(assignment.quest_id) : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export default AdminWeeklyQuestSlots;
