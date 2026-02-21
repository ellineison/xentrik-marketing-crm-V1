import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface GamificationRank {
  id: string;
  name: string;
  min_xp: number;
  max_xp: number | null;
  badge_color: string;
  sort_order: number;
}

export interface ChatterStats {
  id: string;
  chatter_id: string;
  total_xp: number;
  banana_balance: number;
  created_at: string;
  updated_at: string;
  profile?: {
    name: string;
    profile_image?: string;
  };
}

export interface Quest {
  id: string;
  title: string;
  game_name: string | null;
  description: string | null;
  quest_type: 'daily' | 'weekly' | 'monthly';
  xp_reward: number;
  banana_reward: number;
  progress_target: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface QuestAssignment {
  id: string;
  quest_id: string;
  start_date: string;
  end_date: string;
  assigned_by: string | null;
  custom_word: string | null;
  custom_word_description: string | null;
  created_at: string;
  quest?: Quest;
}

export interface QuestCompletion {
  id: string;
  chatter_id: string;
  quest_assignment_id: string;
  completed_at: string;
  xp_earned: number;
  bananas_earned: number;
  verified_by: string | null;
  verified_at: string | null;
  status: 'pending' | 'verified' | 'rejected';
  attachments?: string[];
}

export interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  banana_cost: number;
  stock: number | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Purchase {
  id: string;
  chatter_id: string;
  shop_item_id: string;
  banana_spent: number;
  voucher_code: string;
  status: 'unused' | 'redeemed' | 'expired';
  redeemed_at: string | null;
  redeemed_by: string | null;
  purchased_at: string;
  shop_item?: ShopItem;
}

export interface QuestProgress {
  quest_assignment_id: string;
  chatter_id: string;
  slot_number: number;
  attachment_url: string;
}

export const useGamification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [ranks, setRanks] = useState<GamificationRank[]>([]);
  const [myStats, setMyStats] = useState<ChatterStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<ChatterStats[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<QuestAssignment[]>([]);
  const [myCompletions, setMyCompletions] = useState<QuestCompletion[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [myPurchases, setMyPurchases] = useState<Purchase[]>([]);
  const [myProgress, setMyProgress] = useState<QuestProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch ranks
  const fetchRanks = useCallback(async () => {
    const { data, error } = await supabase
      .from('gamification_ranks')
      .select('*')
      .order('sort_order');
    
    if (error) {
      console.error('Error fetching ranks:', error);
      return;
    }
    setRanks(data || []);
  }, []);

  // Fetch my stats or create if not exists
  const fetchMyStats = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('gamification_chatter_stats')
      .select('*')
      .eq('chatter_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching my stats:', error);
      return;
    }

    if (!data) {
      // Create stats for new user
      const { data: newStats, error: insertError } = await supabase
        .from('gamification_chatter_stats')
        .insert({ chatter_id: user.id })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating stats:', insertError);
        return;
      }
      setMyStats(newStats);
    } else {
      setMyStats(data);
    }
  }, [user]);

  // Fetch leaderboard - all chatters with their stats
  const fetchLeaderboard = useCallback(async () => {
    // First, get all profiles with "Chatter" in their roles array
    const { data: chatterProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, profile_image, roles')
      .contains('roles', ['Chatter']);

    if (profilesError) {
      console.error('Error fetching chatter profiles:', profilesError);
      return;
    }

    if (!chatterProfiles || chatterProfiles.length === 0) {
      setLeaderboard([]);
      return;
    }

    // Get stats for all chatters
    const chatterIds = chatterProfiles.map(p => p.id);
    const { data: statsData, error: statsError } = await supabase
      .from('gamification_chatter_stats')
      .select('*')
      .in('chatter_id', chatterIds);

    if (statsError) {
      console.error('Error fetching chatter stats:', statsError);
      return;
    }

    // Merge profiles with stats, defaulting to 0 XP/bananas if no stats exist
    const leaderboardData: ChatterStats[] = chatterProfiles.map(profile => {
      const stats = statsData?.find(s => s.chatter_id === profile.id);
      return {
        id: stats?.id || profile.id,
        chatter_id: profile.id,
        total_xp: stats?.total_xp || 0,
        banana_balance: stats?.banana_balance || 0,
        created_at: stats?.created_at || new Date().toISOString(),
        updated_at: stats?.updated_at || new Date().toISOString(),
        profile: {
          name: profile.name,
          profile_image: profile.profile_image || undefined
        }
      };
    });

    // Sort by XP descending
    leaderboardData.sort((a, b) => b.total_xp - a.total_xp);

    setLeaderboard(leaderboardData);
  }, []);

  // Fetch all quests (for admin)
  const fetchQuests = useCallback(async () => {
    const { data, error } = await supabase
      .from('gamification_quests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quests:', error);
      return;
    }
    setQuests((data as Quest[]) || []);
  }, []);

  // Fetch active assignments (current quests)
  const fetchActiveAssignments = useCallback(async () => {
    // Use local date to match how dates are saved
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Only treat assignments created by Admins (or with null assigned_by) as globally active.
    // This prevents chatter-created assignments (e.g. from personal re-roll flows) from showing up for everyone.
    const { data: adminProfiles, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .or('role.eq.Admin,roles.cs.{Admin}');

    if (adminError) {
      console.error('Error fetching admin profiles:', adminError);
    }

    const adminIds = (adminProfiles || []).map((p: any) => p.id).filter(Boolean);

    let query = supabase
      .from('gamification_quest_assignments')
      .select(`
        *,
        quest:gamification_quests (*)
      `)
      .lte('start_date', today)
      .gte('end_date', today);

    if (adminIds.length > 0) {
      query = query.or(`assigned_by.is.null,assigned_by.in.(${adminIds.join(',')})`);
    } else {
      // Fallback: if we couldn't resolve admins, only show system assignments.
      query = query.is('assigned_by', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching assignments:', error);
      return;
    }

    setActiveAssignments((data as any) || []);
  }, []);

  // Fetch my completions
  const fetchMyCompletions = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('gamification_quest_completions')
      .select('*')
      .eq('chatter_id', user.id);

    if (error) {
      console.error('Error fetching completions:', error);
      return;
    }
    setMyCompletions((data as QuestCompletion[]) || []);
  }, [user]);

  // Fetch shop items
  const fetchShopItems = useCallback(async () => {
    const { data, error } = await supabase
      .from('gamification_shop_items')
      .select('*')
      .order('banana_cost');

    if (error) {
      console.error('Error fetching shop items:', error);
      return;
    }
    setShopItems(data || []);
  }, []);

  // Fetch my purchases
  const fetchMyPurchases = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('gamification_purchases')
      .select(`
        *,
        shop_item:gamification_shop_items (*)
      `)
      .eq('chatter_id', user.id)
      .order('purchased_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchases:', error);
      return;
    }
    setMyPurchases((data as any) || []);
  }, [user]);

  // Fetch my quest progress (uploaded screenshots)
  const fetchMyProgress = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('gamification_quest_progress')
      .select('*')
      .eq('chatter_id', user.id);

    if (error) {
      console.error('Error fetching progress:', error);
      return;
    }
    setMyProgress((data as QuestProgress[]) || []);
  }, [user]);

  // Get current rank based on XP
  const getCurrentRank = useCallback((xp: number): GamificationRank | null => {
    return ranks.find(rank => 
      xp >= rank.min_xp && (rank.max_xp === null || xp <= rank.max_xp)
    ) || null;
  }, [ranks]);

  // Submit quest completion
  const submitQuestCompletion = async (assignmentId: string) => {
    if (!user) return false;

    const assignment = activeAssignments.find(a => a.id === assignmentId);
    if (!assignment?.quest) return false;

    try {
      // Check if already completed
      const existing = myCompletions.find(c => c.quest_assignment_id === assignmentId);
      if (existing) {
        toast({
          title: "Already Submitted",
          description: "You've already submitted this quest for verification",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from('gamification_quest_completions')
        .insert({
          chatter_id: user.id,
          quest_assignment_id: assignmentId,
          xp_earned: assignment.quest.xp_reward,
          bananas_earned: assignment.quest.banana_reward,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Quest Submitted!",
        description: "Your quest completion is pending admin verification",
      });

      fetchMyCompletions();
      return true;
    } catch (error) {
      console.error('Error submitting quest:', error);
      toast({
        title: "Error",
        description: "Failed to submit quest completion",
        variant: "destructive",
      });
      return false;
    }
  };

  // Verify quest completion (admin only)
  const verifyQuestCompletion = async (completionId: string, approve: boolean) => {
    if (!user) return false;

    try {
      const { data: completion, error: fetchError } = await supabase
        .from('gamification_quest_completions')
        .select('*, quest_assignment:gamification_quest_assignments(quest:gamification_quests(*))')
        .eq('id', completionId)
        .single();

      if (fetchError) throw fetchError;

      const status = approve ? 'verified' : 'rejected';
      
      const { error: updateError } = await supabase
        .from('gamification_quest_completions')
        .update({
          status,
          verified_by: user.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', completionId);

      if (updateError) throw updateError;

      // If approved, award XP and bananas
      if (approve && completion) {
        const xpEarned = completion.xp_earned;
        const bananasEarned = completion.bananas_earned;
        const chatterId = completion.chatter_id;

        // Update chatter stats
        const { data: stats } = await supabase
          .from('gamification_chatter_stats')
          .select('*')
          .eq('chatter_id', chatterId)
          .single();

        if (stats) {
          await supabase
            .from('gamification_chatter_stats')
            .update({
              total_xp: stats.total_xp + xpEarned,
              banana_balance: stats.banana_balance + bananasEarned,
              updated_at: new Date().toISOString()
            })
            .eq('chatter_id', chatterId);
        }

        // Record transactions
        await supabase.from('gamification_xp_transactions').insert({
          chatter_id: chatterId,
          amount: xpEarned,
          source_type: 'quest_completion',
          source_id: completionId
        });

        await supabase.from('gamification_banana_transactions').insert({
          chatter_id: chatterId,
          amount: bananasEarned,
          transaction_type: 'earned',
          source_type: 'quest_completion',
          source_id: completionId
        });
      }

      toast({
        title: approve ? "Quest Verified!" : "Quest Rejected",
        description: approve ? "Rewards have been awarded" : "Quest completion was rejected",
      });

      return true;
    } catch (error) {
      console.error('Error verifying quest:', error);
      toast({
        title: "Error",
        description: "Failed to verify quest",
        variant: "destructive",
      });
      return false;
    }
  };

  // Purchase item
  const purchaseItem = async (itemId: string) => {
    if (!user || !myStats) return false;

    const item = shopItems.find(i => i.id === itemId);
    if (!item) return false;

    if (myStats.banana_balance < item.banana_cost) {
      toast({
        title: "Insufficient Bananas",
        description: "You don't have enough bananas for this item",
        variant: "destructive",
      });
      return false;
    }

    if (item.stock !== null && item.stock <= 0) {
      toast({
        title: "Out of Stock",
        description: "This item is currently out of stock",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Generate voucher code
      const voucherCode = `VCH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Create purchase
      const { error: purchaseError } = await supabase
        .from('gamification_purchases')
        .insert({
          chatter_id: user.id,
          shop_item_id: itemId,
          banana_spent: item.banana_cost,
          voucher_code: voucherCode
        });

      if (purchaseError) throw purchaseError;

      // Deduct bananas
      await supabase
        .from('gamification_chatter_stats')
        .update({
          banana_balance: myStats.banana_balance - item.banana_cost,
          updated_at: new Date().toISOString()
        })
        .eq('chatter_id', user.id);

      // Record transaction
      await supabase.from('gamification_banana_transactions').insert({
        chatter_id: user.id,
        amount: -item.banana_cost,
        transaction_type: 'spent',
        source_type: 'purchase',
        notes: `Purchased: ${item.name}`
      });

      // Reduce stock if applicable
      if (item.stock !== null) {
        await supabase
          .from('gamification_shop_items')
          .update({ stock: item.stock - 1 })
          .eq('id', itemId);
      }

      toast({
        title: "Purchase Successful!",
        description: `Your voucher code: ${voucherCode}`,
      });

      // Refresh data
      fetchMyStats();
      fetchMyPurchases();
      fetchShopItems();

      return true;
    } catch (error) {
      console.error('Error purchasing item:', error);
      toast({
        title: "Error",
        description: "Failed to complete purchase",
        variant: "destructive",
      });
      return false;
    }
  };

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchRanks(),
        fetchMyStats(),
        fetchLeaderboard(),
        fetchQuests(),
        fetchActiveAssignments(),
        fetchMyCompletions(),
        fetchShopItems(),
        fetchMyPurchases(),
        fetchMyProgress()
      ]);
      setIsLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user, fetchRanks, fetchMyStats, fetchLeaderboard, fetchQuests, fetchActiveAssignments, fetchMyCompletions, fetchShopItems, fetchMyPurchases, fetchMyProgress]);

  // Helper to get progress count for an assignment
  const getProgressCount = useCallback((assignmentId: string): number => {
    return myProgress.filter(p => p.quest_assignment_id === assignmentId).length;
  }, [myProgress]);

  return {
    ranks,
    myStats,
    leaderboard,
    quests,
    activeAssignments,
    myCompletions,
    shopItems,
    myPurchases,
    myProgress,
    isLoading,
    getCurrentRank,
    getProgressCount,
    submitQuestCompletion,
    verifyQuestCompletion,
    purchaseItem,
    refetch: {
      ranks: fetchRanks,
      myStats: fetchMyStats,
      leaderboard: fetchLeaderboard,
      quests: fetchQuests,
      activeAssignments: fetchActiveAssignments,
      myCompletions: fetchMyCompletions,
      shopItems: fetchShopItems,
      myPurchases: fetchMyPurchases,
      myProgress: fetchMyProgress
    }
  };
};
