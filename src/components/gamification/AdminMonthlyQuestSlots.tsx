import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import QuestSlotCard from './QuestSlotCard';
import { Quest } from '@/hooks/useGamification';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface AdminMonthlyQuestSlotsProps {
  onRemoveAssignment?: (questId: string) => void;
}

interface AdminAssignment {
  id: string;
  quest_id: string;
  start_date: string;
  end_date: string;
  quest?: Quest;
}

const AdminMonthlyQuestSlots: React.FC<AdminMonthlyQuestSlotsProps> = ({ onRemoveAssignment }) => {
  const [assignments, setAssignments] = useState<AdminAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date();
  const monthStartDate = format(startOfMonth(today), 'yyyy-MM-dd');
  const monthEndDate = format(endOfMonth(today), 'yyyy-MM-dd');
  const todayStr = format(today, 'yyyy-MM-dd');

  // Fetch ADMIN-assigned monthly quests (assigned_by IS NULL)
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
        console.error('Error fetching admin monthly assignments:', error);
      }

      // Filter to only monthly quests
      const monthlyAssignments = (data || []).filter(
        (a: any) => a.quest?.quest_type === 'monthly'
      );

      setAssignments(monthlyAssignments as AdminAssignment[]);
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
            <Crown className="h-5 w-5 text-purple-500" />
            Monthly Quests
          </CardTitle>
          <CardDescription>
            No monthly quest assigned for this month. Use "Assign Quest" to add 1 monthly quest.
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
            <Crown className="h-5 w-5 text-purple-500" />
            Monthly Quests
          </h2>
          <p className="text-sm text-muted-foreground">
            {format(today, 'MMMM yyyy')}
          </p>
        </div>
        <Badge variant="outline" className="text-base px-3 py-1 border-purple-500/30 font-bold">
          {assignments.length}/1
        </Badge>
      </div>

      {/* Quest Cards */}
      <div className="grid gap-3">
        {assignments.map((assignment) => (
          <QuestSlotCard
            key={assignment.id}
            quest={assignment.quest}
            questType="monthly"
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

export default AdminMonthlyQuestSlots;
