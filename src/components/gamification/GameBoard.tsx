import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Trophy, Star, Crown, Medal } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { useDailyQuestSlots } from '@/hooks/useDailyQuestSlots';
import { useWeeklyQuestSlots } from '@/hooks/useWeeklyQuestSlots';
import { useMonthlyQuestSlots } from '@/hooks/useMonthlyQuestSlots';
import { useAuth } from '@/context/AuthContext';
import { getRankCrownColor } from './PlayerCard';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface GameBoardProps {
  isAdmin: boolean;
}

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

// Leaderboard position colors (top 3)
const POSITION_COLORS = {
  1: '#f1c40f', // Gold
  2: '#95a5a6', // Silver
  3: '#cd7f32', // Bronze
};

const getPositionColor = (position: number): string | null => {
  return POSITION_COLORS[position as keyof typeof POSITION_COLORS] || null;
};

const GameBoard: React.FC<GameBoardProps> = ({ isAdmin }) => {
  const { user } = useAuth();
  const {
    ranks,
    myStats,
    leaderboard,
    myCompletions,
    isLoading: gamificationLoading,
    getCurrentRank,
    getProgressCount,
  } = useGamification();

  // Use player-specific slots instead of global activeAssignments
  const { slots: dailySlots, isLoading: dailyLoading } = useDailyQuestSlots();
  const { slots: weeklySlots, isLoading: weeklyLoading } = useWeeklyQuestSlots();
  const { slots: monthlySlots, isLoading: monthlyLoading } = useMonthlyQuestSlots();

  // Track progress counts per quest
  const [questProgress, setQuestProgress] = useState<Record<string, number>>({});

  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  // Fetch progress for all quests
  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) return;

      const questIds = [
        ...dailySlots.map(s => s.quest_id),
        ...weeklySlots.map(s => s.quest_id),
        ...monthlySlots.map(s => s.quest_id),
      ].filter(Boolean);

      if (questIds.length === 0) return;

      // Find assignments for these quests
      const { data: assignments } = await supabase
        .from('gamification_quest_assignments')
        .select('id, quest_id')
        .in('quest_id', questIds)
        .lte('start_date', today)
        .gte('end_date', today);

      if (!assignments || assignments.length === 0) return;

      const assignmentIds = assignments.map(a => a.id);

      // Fetch progress for these assignments
      const { data: progressData } = await supabase
        .from('gamification_quest_progress')
        .select('quest_assignment_id')
        .eq('chatter_id', user.id)
        .in('quest_assignment_id', assignmentIds);

      if (!progressData) return;

      // Build map: quest_id -> progress count
      const progressMap: Record<string, number> = {};
      for (const qId of questIds) {
        const assignment = assignments.find(a => a.quest_id === qId);
        if (assignment) {
          progressMap[qId] = progressData.filter(p => p.quest_assignment_id === assignment.id).length;
        } else {
          progressMap[qId] = 0;
        }
      }

      setQuestProgress(progressMap);
    };

    fetchProgress();
  }, [user, dailySlots, weeklySlots, monthlySlots, today]);

  const isLoading = gamificationLoading || dailyLoading || weeklyLoading || monthlyLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>Loading game board...</span>
      </div>
    );
  }

  const currentRank = myStats ? getCurrentRank(myStats.total_xp) : null;
  const rankCrownColor = currentRank ? getRankCrownColor(currentRank.name) : '#808080';
  
  const nextRank = currentRank && ranks.length > 0
    ? ranks.find(r => r.sort_order === (currentRank?.sort_order || 0) + 1)
    : null;
  
  const xpToNextRank = nextRank && currentRank
    ? nextRank.min_xp - (myStats?.total_xp || 0)
    : 0;
  
  const xpProgress = nextRank && currentRank
    ? ((myStats?.total_xp || 0) - currentRank.min_xp) / (nextRank.min_xp - currentRank.min_xp) * 100
    : 100;

  const myPosition = leaderboard.findIndex(s => s.chatter_id === user?.id) + 1;
  const positionColor = getPositionColor(myPosition);

  // Build quest cards from player's personal slots
  interface QuestCardData {
    id: string;
    questId: string;
    questType: 'daily' | 'weekly' | 'monthly';
    quest: any;
    slotNumber: number;
    completed: boolean;
  }

  const questCards: QuestCardData[] = [];

  // Add daily quests
  dailySlots.forEach(slot => {
    if (slot.quest) {
      questCards.push({
        id: slot.id,
        questId: slot.quest_id,
        questType: 'daily',
        quest: slot.quest,
        slotNumber: slot.slot_number,
        completed: slot.completed
      });
    }
  });

  // Add weekly quest
  weeklySlots.forEach(slot => {
    if (slot.quest) {
      questCards.push({
        id: slot.id,
        questId: slot.quest_id,
        questType: 'weekly',
        quest: slot.quest,
        slotNumber: slot.slot_number,
        completed: slot.completed
      });
    }
  });

  // Add monthly quest
  monthlySlots.forEach(slot => {
    if (slot.quest) {
      questCards.push({
        id: slot.id,
        questId: slot.quest_id,
        questType: 'monthly',
        quest: slot.quest,
        slotNumber: slot.slot_number,
        completed: slot.completed
      });
    }
  });

  // Sort: weekly first, then monthly, then daily
  const sortedQuestCards = [...questCards].sort((a, b) => {
    const order = { weekly: 0, monthly: 1, daily: 2 };
    return order[a.questType] - order[b.questType];
  });

  // Helper to find assignment ID for a quest to check completion status
  const getCompletionStatusForQuest = (questId: string) => {
    // Find completion by matching quest_id through the assignments
    return myCompletions.find(c => {
      // Match by quest assignment that has this quest
      return c.quest_assignment_id && questId;
    });
  };

  return (
    <div className="space-y-6" style={{ fontFamily: "'Orbitron', sans-serif" }}>
      {/* Header */}
      <div>
        <h1 
          className="text-4xl font-bold text-foreground uppercase tracking-wide"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          Game Board
        </h1>
        <p className="text-muted-foreground text-base mt-1">
          Welcome back, Chatter. Status report follows.
        </p>
      </div>

      {/* Stats Grid - 4 Panels */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rank Panel - colored by rank, crown only */}
        <Card 
          className="border-2"
          style={{ 
            backgroundColor: `${rankCrownColor}15`,
            borderColor: `${rankCrownColor}50`
          }}
        >
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Current Rank</p>
            <div className="flex flex-col items-center justify-center gap-1">
              <Crown 
                className="h-8 w-8" 
                style={{ color: rankCrownColor }}
                fill={rankCrownColor}
                strokeWidth={1.5}
              />
              <p 
                className="text-lg font-bold uppercase"
                style={{ 
                  fontFamily: "'Orbitron', sans-serif",
                  color: rankCrownColor
                }}
              >
                {currentRank?.name || 'Unranked'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard Position Panel - colored by position */}
        <Card 
          className="border-2"
          style={{ 
            backgroundColor: positionColor ? `${positionColor}15` : 'rgba(var(--card), 0.8)',
            borderColor: positionColor ? `${positionColor}50` : 'rgba(var(--border), 0.5)'
          }}
        >
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Leaderboard</p>
            <p 
              className="text-3xl font-bold"
              style={{ 
                fontFamily: "'Orbitron', sans-serif",
                color: positionColor || rankCrownColor
              }}
            >
              #{myPosition || '-'}
            </p>
          </CardContent>
        </Card>

        {/* Banana Count Panel */}
        <Card className="bg-card/80 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Bananas</p>
            <p className="text-3xl font-bold text-yellow-500 flex items-center justify-center gap-2">
              <span>🍌</span>
              <span style={{ fontFamily: "'Orbitron', sans-serif" }}>{myStats?.banana_balance || 0}</span>
            </p>
          </CardContent>
        </Card>

        {/* XP Count Panel */}
        <Card className="bg-card/80 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total XP</p>
            <p 
              className="text-3xl font-bold text-primary"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              {myStats?.total_xp || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress to Next Rank */}
      {nextRank && (
        <Card className="bg-card/80 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground uppercase tracking-wider">Progress to {nextRank.name}</span>
              <span className="text-sm text-muted-foreground">{xpToNextRank} XP to go</span>
            </div>
            <Progress value={xpProgress} className="h-3" />
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Directives - Left Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-7 bg-primary rounded-full" />
            <h2 
              className="text-2xl font-bold uppercase tracking-wide"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              Active Directives
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedQuestCards.map(card => {
              const config = questTypeConfig[card.questType];
              const IconComponent = config.icon;
              const isCompleted = card.completed;
              const progressTarget = card.quest?.progress_target || 1;
              // Use actual progress from questProgress map, or full if completed
              const currentProgress = isCompleted ? progressTarget : (questProgress[card.questId] || 0);
              
              return (
                <Card 
                  key={card.id} 
                  className={`bg-card/80 border-border/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50 ${isCompleted ? 'opacity-60' : ''}`}
                >
                  <CardContent className="p-4">
                    {/* Type Badge & Rewards */}
                    <div className="flex items-center justify-between mb-3">
                      <Badge 
                        variant="outline" 
                        className={`text-xs uppercase tracking-wider ${config.badgeClass}`}
                        style={{ fontFamily: "'Orbitron', sans-serif" }}
                      >
                        <IconComponent className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span 
                          className="text-sm font-bold text-primary"
                          style={{ fontFamily: "'Orbitron', sans-serif" }}
                        >
                          {card.quest?.xp_reward} XP
                        </span>
                        <span className="text-sm text-yellow-500">🍌{card.quest?.banana_reward}</span>
                      </div>
                    </div>

                    {/* Game Name */}
                    <h3 
                      className="text-lg font-bold uppercase text-foreground leading-tight mb-3"
                      style={{ fontFamily: "'Orbitron', sans-serif" }}
                    >
                      {card.quest?.game_name || card.quest?.title}
                    </h3>

                    {/* Progress with target from DB */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground uppercase">
                        <span>Progress</span>
                        <span className="flex items-center gap-2">
                          {currentProgress} / {progressTarget}
                          {isCompleted && <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0">✓</Badge>}
                        </span>
                      </div>
                      <Progress 
                        value={(currentProgress / progressTarget) * 100} 
                        className="h-2" 
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {sortedQuestCards.length === 0 && (
              <Card className="bg-card/80 border-border/50 col-span-2">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No active directives at this time.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Leaderboard - Right Column (Full) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-7 bg-primary rounded-full" />
            <h2 
              className="text-2xl font-bold uppercase tracking-wide"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              Leaderboard
            </h2>
          </div>

          <Card className="bg-card/80 border-border/50">
            <CardContent className="p-4">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 pb-3 border-b border-border/50 text-sm text-muted-foreground uppercase tracking-wider">
                <div className="col-span-2">Rank</div>
                <div className="col-span-7">Agent</div>
                <div className="col-span-3 text-right">XP</div>
              </div>

              {/* Full Leaderboard */}
              <div className="space-y-1 mt-3 max-h-96 overflow-y-auto">
                {leaderboard.map((stats, index) => {
                  const rank = getCurrentRank(stats.total_xp);
                  const crownColor = rank ? getRankCrownColor(rank.name) : '#808080';
                  const isMe = stats.chatter_id === user?.id;
                  
                  return (
                    <div 
                      key={stats.id} 
                      className={`grid grid-cols-12 gap-2 items-center py-2 rounded px-1 ${isMe ? 'bg-primary/10 border border-primary/30' : ''}`}
                    >
                      <div className="col-span-2 flex items-center justify-center">
                        {index === 0 && <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />}
                        {index === 1 && <span className="text-muted-foreground text-base font-bold">2</span>}
                        {index === 2 && <span className="text-muted-foreground text-base font-bold">3</span>}
                        {index > 2 && <span className="text-muted-foreground text-sm">{index + 1}</span>}
                      </div>
                      <div className="col-span-7 flex items-center gap-2 min-w-0">
                        {/* Crown icon instead of text badge */}
                        <Crown 
                          className="h-4 w-4 shrink-0" 
                          style={{ color: crownColor }}
                          fill={crownColor}
                          strokeWidth={1.5}
                        />
                        <span 
                          className={`text-sm truncate ${isMe ? 'text-primary font-bold' : 'text-foreground'}`}
                        >
                          {isMe ? 'You' : stats.profile?.name || 'Unknown'}
                        </span>
                      </div>
                      <div
                        className="col-span-3 text-right text-sm font-bold"
                        style={{ 
                          fontFamily: "'Orbitron', sans-serif",
                          color: crownColor
                        }}
                      >
                        {stats.total_xp}
                      </div>
                    </div>
                  );
                })}

                {leaderboard.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No agents on the leaderboard yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
};

export default GameBoard;
