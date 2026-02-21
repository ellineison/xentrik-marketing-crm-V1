import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import QuestSlotCard from './QuestSlotCard';
import { Quest } from '@/hooks/useGamification';
import { getEffectiveGameDate, getEffectiveGameDateDisplay } from '@/utils/gameDate';

interface AdminDailyQuestSlotsProps {
  onRemoveAssignment?: (questId: string) => void;
}

interface AdminAssignment {
  id: string;
  quest_id: string;
  start_date: string;
  end_date: string;
  quest?: Quest;
}

const AdminDailyQuestSlots: React.FC<AdminDailyQuestSlotsProps> = ({ onRemoveAssignment }) => {
  const [assignments, setAssignments] = useState<AdminAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const today = getEffectiveGameDate();

  // Fetch ADMIN-assigned daily quests (assigned_by IS NULL)
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
        .eq('start_date', today)
        .eq('end_date', today)
        .is('assigned_by', null);

      if (error) {
        console.error('Error fetching admin daily assignments:', error);
      }

      // Filter to only daily quests
      const dailyAssignments = (data || []).filter(
        (a: any) => a.quest?.quest_type === 'daily'
      );

      setAssignments(dailyAssignments as AdminAssignment[]);
      setIsLoading(false);
    };

    fetchAdminAssignments();
  }, [today]);

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
            <Star className="h-5 w-5 text-yellow-500" />
            Daily Quests
          </CardTitle>
          <CardDescription>
            No daily quests assigned for today. Use "Assign Quest" to add up to 4 daily quests.
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
            <Star className="h-5 w-5 text-yellow-500" />
            Daily Quests
          </h2>
          <p className="text-sm text-muted-foreground">
            Active for today ({getEffectiveGameDateDisplay()})
          </p>
        </div>
        <Badge variant="outline" className="text-base px-3 py-1 border-primary/30 font-bold">
          {assignments.length}/4
        </Badge>
      </div>

      {/* Quest Cards Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {assignments.map((assignment) => (
          <QuestSlotCard
            key={assignment.id}
            quest={assignment.quest}
            questType="daily"
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

export default AdminDailyQuestSlots;
