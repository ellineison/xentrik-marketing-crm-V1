import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Quest } from '@/hooks/useGamification';
import { format, startOfWeek } from 'date-fns';

export interface WeeklyQuestSlot {
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

// Use slot_number 100 for weekly quests to distinguish from daily (1-4)
const WEEKLY_SLOT_NUMBER = 100;

export const useWeeklyQuestSlots = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [slots, setSlots] = useState<WeeklyQuestSlot[]>([]);
  const [allWeeklyQuests, setAllWeeklyQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRerolling, setIsRerolling] = useState<number | null>(null);

  // Use week start date as the identifier
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  // Fetch ALL active weekly quests (for re-roll pool)
  const fetchAllWeeklyQuests = useCallback(async () => {
    const { data, error } = await supabase
      .from('gamification_quests')
      .select('*')
      .eq('quest_type', 'weekly')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching all weekly quests:', error);
      return [];
    }
    
    setAllWeeklyQuests((data as Quest[]) || []);
    return (data as Quest[]) || [];
  }, []);

  // Fetch user's weekly quest slot
  const fetchSlots = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('gamification_daily_quest_slots')
      .select(`
        *,
        quest:gamification_quests (*)
      `)
      .eq('chatter_id', user.id)
      .eq('date', weekStart)
      .eq('slot_number', WEEKLY_SLOT_NUMBER);

    if (error) {
      console.error('Error fetching weekly quest slots:', error);
      return;
    }

    setSlots((data as any) || []);
  }, [user, weekStart]);

  // Fetch this week's admin-assigned quest and populate user slot
  const populateSlotsFromAdminAssignments = useCallback(async () => {
    if (!user) return;

    // Check if user already has a weekly slot for this week
    const { data: existingSlots } = await supabase
      .from('gamification_daily_quest_slots')
      .select('id')
      .eq('chatter_id', user.id)
      .eq('date', weekStart)
      .eq('slot_number', WEEKLY_SLOT_NUMBER);

    if (existingSlots && existingSlots.length > 0) {
      return; // Already has a slot
    }

    // Fetch this week's ADMIN-assigned weekly quest (assigned_by is null)
    // Personal assignments are NOT included to prevent re-rolls from propagating
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data: weeklyAssignments, error: assignmentError } = await supabase
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

    // Filter to only weekly quests
    const weeklyAssignment = (weeklyAssignments || []).find(
      (a: any) => a.quest?.quest_type === 'weekly'
    );

    if (!weeklyAssignment) {
      return; // No admin-assigned weekly quest
    }

    // Create slot for this user
    const { error } = await supabase
      .from('gamification_daily_quest_slots')
      .insert({
        chatter_id: user.id,
        slot_number: WEEKLY_SLOT_NUMBER,
        quest_id: weeklyAssignment.quest_id,
        date: weekStart,
        has_rerolled: false,
        completed: false
      });

    if (error) {
      console.error('Error populating weekly quest slot:', error);
    }
  }, [user, weekStart]);

  // Re-roll the weekly quest
  const rerollSlot = async () => {
    if (!user) return false;

    const slot = slots[0];
    if (!slot) {
      toast({
        title: "Error",
        description: "Weekly quest slot not found",
        variant: "destructive"
      });
      return false;
    }

    if (slot.has_rerolled) {
      toast({
        title: "Already Re-rolled",
        description: "You can only re-roll the weekly quest once",
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

    setIsRerolling(WEEKLY_SLOT_NUMBER);

    try {
      // Filter to exclude current quest
      const questPool = allWeeklyQuests.filter(q => q.id !== slot.quest_id);
      
      if (questPool.length === 0) {
        toast({
          title: "No Quests Available",
          description: "There are no other weekly quests to re-roll to",
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
        description: `New weekly quest: ${newQuest.title}`,
      });

      await fetchSlots();
      return true;
    } catch (error) {
      console.error('Error re-rolling weekly quest:', error);
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
      await fetchAllWeeklyQuests();
      await populateSlotsFromAdminAssignments();
      await fetchSlots();
      setIsLoading(false);
    };

    init();
  }, [user, fetchAllWeeklyQuests, populateSlotsFromAdminAssignments, fetchSlots]);

  return {
    slots,
    allWeeklyQuests,
    isLoading,
    isRerolling: isRerolling === WEEKLY_SLOT_NUMBER,
    rerollSlot,
    refetch: fetchSlots
  };
};
