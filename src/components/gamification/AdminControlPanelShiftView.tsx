import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Star, Medal, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import QuestSlotCard from './QuestSlotCard';
import { Quest } from '@/hooks/useGamification';
import { getEffectiveGameDate } from '@/utils/gameDate';

const SHIFTS = ['6AM', '2PM', '10PM'] as const;

const questTypeConfig = {
  daily: { label: 'Daily', icon: Star, color: 'text-yellow-500' },
  weekly: { label: 'Weekly', icon: Medal, color: 'text-blue-500' },
  monthly: { label: 'Monthly', icon: Crown, color: 'text-purple-500' },
};

interface AdminAssignment {
  id: string;
  quest_id: string;
  department: string | null;
  quest?: Quest;
}

interface AdminControlPanelShiftViewProps {
  onRemoveAssignment?: (questId: string) => void;
}

const AdminControlPanelShiftView: React.FC<AdminControlPanelShiftViewProps> = ({ onRemoveAssignment }) => {
  const [assignments, setAssignments] = useState<AdminAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const today = getEffectiveGameDate();

  useEffect(() => {
    const fetchAssignments = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('gamification_quest_assignments')
        .select('id, quest_id, department, quest:gamification_quests(*)')
        .lte('start_date', today)
        .gte('end_date', today)
        .is('assigned_by', null);

      if (!error && data) {
        const filtered = (data as any[]).filter(
          (a) => a.quest && ['daily', 'weekly', 'monthly'].includes(a.quest.quest_type)
        );
        setAssignments(filtered);
      }
      setIsLoading(false);
    };
    fetchAssignments();
  }, [today]);

  if (isLoading) {
    return (
      <div className="py-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const getShiftAssignments = (shift: string) => {
    return assignments.filter((a) => {
      const effectiveDept = a.department || '2PM';
      return effectiveDept === shift;
    });
  };

  return (
    <div className="space-y-6">
      {SHIFTS.map((shift) => {
        const shiftAssignments = getShiftAssignments(shift);
        const daily = shiftAssignments.filter((a) => a.quest?.quest_type === 'daily');
        const weekly = shiftAssignments.filter((a) => a.quest?.quest_type === 'weekly');
        const monthly = shiftAssignments.filter((a) => a.quest?.quest_type === 'monthly');

        return (
          <Card key={shift} className="border-border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                <h3 className="text-lg font-bold uppercase tracking-wide text-primary">
                  {shift} Shift
                </h3>
                <Badge variant="outline" className="text-xs">
                  {shiftAssignments.length} quest{shiftAssignments.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {shiftAssignments.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">
                  No tasks assigned yet
                </p>
              ) : (
                <div className="space-y-5">
                  {[
                    { type: 'daily' as const, items: daily },
                    { type: 'weekly' as const, items: weekly },
                    { type: 'monthly' as const, items: monthly },
                  ]
                    .filter((s) => s.items.length > 0)
                    .map(({ type, items }) => {
                      const config = questTypeConfig[type];
                      const Icon = config.icon;
                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${config.color}`} />
                            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                              {config.label}
                            </span>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {items.map((assignment) => (
                              <QuestSlotCard
                                key={assignment.id}
                                quest={assignment.quest}
                                questType={type}
                                status={null}
                                hasRerolled={false}
                                isRerolling={false}
                                isAdminView={true}
                                onRemoveAssignment={
                                  onRemoveAssignment
                                    ? () => onRemoveAssignment(assignment.quest_id)
                                    : undefined
                                }
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AdminControlPanelShiftView;
