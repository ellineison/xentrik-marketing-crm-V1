import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Medal, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getEffectiveGameDate } from '@/utils/gameDate';
import AdminQuestProgressModal from './AdminQuestProgressModal';

const SHIFTS = ['6AM', '2PM', '10PM'] as const;

const questTypeConfig = {
  daily: {
    label: 'Daily',
    badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    icon: Trophy,
  },
  weekly: {
    label: 'Weekly',
    badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    icon: Medal,
  },
  monthly: {
    label: 'Special Ops',
    badgeClass: 'bg-pink-500/20 text-pink-400 border-pink-500/50',
    icon: Crown,
  },
};

interface AssignmentWithQuest {
  id: string;
  quest_id: string;
  department: string | null;
  quest: {
    id: string;
    title: string;
    game_name: string | null;
    quest_type: string;
    xp_reward: number;
    banana_reward: number;
    progress_target: number;
  };
}

const AdminShiftOverview: React.FC = () => {
  const [assignments, setAssignments] = useState<AssignmentWithQuest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const today = useMemo(() => getEffectiveGameDate(), []);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithQuest | null>(null);
  const [selectedShift, setSelectedShift] = useState<string>('');

  useEffect(() => {
    const fetchAssignments = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('gamification_quest_assignments')
        .select('id, quest_id, department, quest:gamification_quests(id, title, game_name, quest_type, xp_reward, banana_reward, progress_target)')
        .lte('start_date', today)
        .gte('end_date', today)
        .is('assigned_by', null);

      if (!error && data) {
        const mapped = data
          .filter((a: any) => a.quest && ['daily', 'weekly', 'monthly'].includes(a.quest.quest_type))
          .map((a: any) => ({
            id: a.id,
            quest_id: a.quest_id,
            department: a.department,
            quest: a.quest,
          }));
        setAssignments(mapped);
      }
      setIsLoading(false);
    };
    fetchAssignments();
  }, [today]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>Loading shift overview...</span>
      </div>
    );
  }

  const getShiftAssignments = (shift: string) => {
    return assignments.filter(a => {
      const effectiveDept = a.department || '2PM';
      return effectiveDept === shift;
    });
  };

  const typeOrder = { daily: 0, weekly: 1, monthly: 2 };

  const handleCardClick = (assignment: AssignmentWithQuest, shift: string) => {
    setSelectedAssignment(assignment);
    setSelectedShift(shift);
    setModalOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        {SHIFTS.map(shift => {
          const shiftAssignments = getShiftAssignments(shift)
            .sort((a, b) => (typeOrder[a.quest.quest_type as keyof typeof typeOrder] ?? 9) - (typeOrder[b.quest.quest_type as keyof typeof typeOrder] ?? 9));

          return (
            <Card key={shift} className="bg-card/80 border-border/50">
              <CardContent className="p-5">
                <h3
                  className="text-lg font-bold uppercase tracking-wide text-primary mb-4 border-b border-border/50 pb-2"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  {shift} Shift
                </h3>

                {shiftAssignments.length === 0 ? (
                  <p className="text-muted-foreground text-sm italic py-4 text-center">
                    No tasks assigned yet
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {shiftAssignments.map(a => {
                      const config = questTypeConfig[a.quest.quest_type as keyof typeof questTypeConfig];
                      if (!config) return null;
                      const IconComponent = config.icon;

                      return (
                        <div
                          key={a.id}
                          className="rounded-lg border border-border/30 bg-background/50 p-3 space-y-2 cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:shadow-primary/10 hover:scale-[1.01]"
                          onClick={() => handleCardClick(a, shift)}
                        >
                          <div className="flex items-center justify-between">
                            <Badge
                              variant="outline"
                              className={`text-[10px] uppercase tracking-wider ${config.badgeClass}`}
                              style={{ fontFamily: "'Orbitron', sans-serif" }}
                            >
                              <IconComponent className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-primary" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                                {a.quest.xp_reward} XP
                              </span>
                              <span className="text-yellow-500">🍌{a.quest.banana_reward}</span>
                            </div>
                          </div>
                          <p
                            className="text-sm font-bold uppercase text-foreground leading-tight"
                            style={{ fontFamily: "'Orbitron', sans-serif" }}
                          >
                            {a.quest.game_name || a.quest.title}
                          </p>
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

      {/* Quest Progress Modal */}
      {selectedAssignment && (
        <AdminQuestProgressModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          assignmentId={selectedAssignment.id}
          questName={selectedAssignment.quest.game_name || selectedAssignment.quest.title}
          questType={selectedAssignment.quest.quest_type}
          progressTarget={selectedAssignment.quest.progress_target}
          shift={selectedShift}
        />
      )}
    </>
  );
};

export default AdminShiftOverview;
