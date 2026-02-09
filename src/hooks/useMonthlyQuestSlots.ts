import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Quest } from '@/hooks/useGamification';
import { format, startOfMonth } from 'date-fns';

export interface MonthlyQuestSlot {
  id: string;
  chatter_id: string;
  slot_number: number;
  quest_id: string;
  date: string;
  has_rerolled: boolean;
  completed: boolean;
  created_at: string;
  updated_at: string;
  quest?: Quest;
}

// Use slot_number 200 for monthly quests to distinguish from daily (1-4) and weekly (100)
const MONTHLY_SLOT_NUMBER = 200;

export const useMonthlyQuestSlots = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [slots, setSlots] = useState<MonthlyQuestSlot[]>([]);
  const [allMonthlyQuests, setAllMonthlyQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRerolling, setIsRerolling] = useState<number | null>(null);

  // Use month start date as the identifier
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  // Fetch ALL active monthly quests (for re-roll pool)
  const fetchAllMonthlyQuests = useCallback(async () => {
    const { data, error } = await supabase
      .from('gamification_quests')
      .select('*')
      .eq('quest_type', 'monthly')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching all monthly quests:', error);
      return [];
    }
    
    setAllMonthlyQuests((data as Quest[]) || []);
    return (data as Quest[]) || [];
  }, []);

  // Fetch user's monthly quest slot
  const fetchSlots = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('gamification_daily_quest_slots')
      .select(`
        *,
        quest:gamification_quests (*)
      `)
      .eq('chatter_id', user.id)
      .eq('date', monthStart)
      .eq('slot_number', MONTHLY_SLOT_NUMBER);

    if (error) {
      console.error('Error fetching monthly quest slots:', error);
      return;
    }

    setSlots((data as any) || []);
  }, [user, monthStart]);

  // Fetch this month's admin-assigned quest and populate user slot
  const populateSlotsFromAdminAssignments = useCallback(async () => {
    if (!user) return;

    // Check if user already has a monthly slot for this month
    const { data: existingSlots } = await supabase
      .from('gamification_daily_quest_slots')
      .select('id')
      .eq('chatter_id', user.id)
      .eq('date', monthStart)
      .eq('slot_number', MONTHLY_SLOT_NUMBER);

    if (existingSlots && existingSlots.length > 0) {
      return; // Already has a slot
    }

    // Fetch this month's ADMIN-assigned monthly quest (assigned_by is null)
    // Personal assignments are NOT included to prevent re-rolls from propagating
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data: monthlyAssignments, error: assignmentError } = await supabase
      .from('gamification_quest_assignments')
      .select(`
        quest_id,
        quest:gamification_quests (*)
      `)
      .lte('start_date', today)
      .gte('end_date', today)
      .is('assigned_by', null);

    if (assignmentError) {
      console.error('Error fetching admin assignments:', assignmentError);
      return;
    }

    // Filter to only monthly quests
    const monthlyAssignment = (monthlyAssignments || []).find(
      (a: any) => a.quest?.quest_type === 'monthly'
    );

    if (!monthlyAssignment) {
      return; // No admin-assigned monthly quest
    }

    // Create slot for this user
    const { error } = await supabase
      .from('gamification_daily_quest_slots')
      .insert({
        chatter_id: user.id,
        slot_number: MONTHLY_SLOT_NUMBER,
        quest_id: monthlyAssignment.quest_id,
        date: monthStart,
        has_rerolled: false,
        completed: false
      });

    if (error) {
      console.error('Error populating monthly quest slot:', error);
    }
  }, [user, monthStart]);

  // Re-roll the monthly quest
  const rerollSlot = async () => {
    if (!user) return false;

    const slot = slots[0];
    if (!slot) {
      toast({
        title: "Error",
        description: "Monthly quest slot not found",
        variant: "destructive"
      });
      return false;
    }

    if (slot.has_rerolled) {
      toast({
        title: "Already Re-rolled",
        description: "You can only re-roll the monthly quest once",
        variant: "destructive"
      });
      return false;
    }

    if (slot.completed) {
      toast({
        title: "Cannot Re-roll",
        description: "You cannot re-roll a completed quest",
        variant: "destructive"
      });
      return false;
    }

    setIsRerolling(MONTHLY_SLOT_NUMBER);

    try {
      // Filter to exclude current quest
      const questPool = allMonthlyQuests.filter(q => q.id !== slot.quest_id);
      
      if (questPool.length === 0) {
        toast({
          title: "No Quests Available",
          description: "There are no other monthly quests to re-roll to",
          variant: "destructive"
        });
        return false;
      }

      // Pick a random quest
      const randomIndex = Math.floor(Math.random() * questPool.length);
      const newQuest = questPool[randomIndex];

      // Update the slot
      const { error } = await supabase
        .from('gamification_daily_quest_slots')
        .update({
          quest_id: newQuest.id,
          has_rerolled: true
        })
        .eq('id', slot.id);

      if (error) throw error;

      toast({
        title: "Quest Re-rolled! 🎲",
        description: `New monthly quest: ${newQuest.title}`,
      });

      await fetchSlots();
      return true;
    } catch (error) {
      console.error('Error re-rolling monthly quest:', error);
      toast({
        title: "Error",
        description: "Failed to re-roll quest",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsRerolling(null);
    }
  };

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      if (!user) return;
      
      setIsLoading(true);
      await fetchAllMonthlyQuests();
      await populateSlotsFromAdminAssignments();
      await fetchSlots();
      setIsLoading(false);
    };

    init();
  }, [user, fetchAllMonthlyQuests, populateSlotsFromAdminAssignments, fetchSlots]);

  return {
    slots,
    allMonthlyQuests,
    isLoading,
    isRerolling: isRerolling === MONTHLY_SLOT_NUMBER,
    rerollSlot,
    refetch: fetchSlots
  };
};
