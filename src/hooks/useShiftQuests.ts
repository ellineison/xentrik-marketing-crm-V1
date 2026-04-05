import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getEffectiveGameDate } from '@/utils/gameDate';

export interface ShiftQuestAssignment {
  id: string;
  quest_id: string;
  shift: '6AM' | '2PM' | '10PM';
  date: string;
  created_by: string | null;
  created_at: string;
  quest?: {
    id: string;
    title: string;
    description: string | null;
    game_name: string | null;
    xp_reward: number;
    banana_reward: number;
    progress_target: number;
    quest_type: string;
  };
}

export interface ShiftQuestCompletion {
  id: string;
  shift_assignment_id: string;
  chatter_id: string;
  status: 'pending' | 'verified' | 'rejected';
  attachments: string[];
  submitted_at: string;
  verified_by: string | null;
  verified_at: string | null;
  profile?: { name: string };
}

export const SHIFT_DEPARTMENTS = ['6AM', '2PM', '10PM'] as const;
export type ShiftDepartment = typeof SHIFT_DEPARTMENTS[number];

export function useShiftQuests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<ShiftQuestAssignment[]>([]);
  const [myShift, setMyShift] = useState<ShiftDepartment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const today = getEffectiveGameDate();

  // Fetch current user's department to determine their shift
  const fetchMyShift = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('department')
      .eq('id', user.id)
      .single();

    if (data?.department && SHIFT_DEPARTMENTS.includes(data.department as ShiftDepartment)) {
      setMyShift(data.department as ShiftDepartment);
    } else {
      setMyShift(null);
    }
  }, [user]);

  // Fetch shift quest assignments for today, filtered by user's shift
  const fetchAssignments = useCallback(async () => {
    if (!user || !myShift) {
      setAssignments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('gamification_shift_quest_assignments')
      .select(`
        *,
        quest:gamification_quests (*)
      `)
      .eq('date', today)
      .eq('shift', myShift)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching shift quest assignments:', error);
    } else {
      setAssignments((data as any) || []);
    }
    setIsLoading(false);
  }, [user, myShift, today]);

  useEffect(() => {
    fetchMyShift();
  }, [fetchMyShift]);

  useEffect(() => {
    if (myShift) {
      fetchAssignments();
    } else {
      setAssignments([]);
      setIsLoading(false);
    }
  }, [myShift, fetchAssignments]);

  const refetch = useCallback(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return {
    assignments,
    myShift,
    isLoading,
    today,
    refetch,
  };
}

/**
 * Admin hook for managing shift quest assignments
 */
export function useAdminShiftQuests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<ShiftQuestAssignment[]>([]);
  const [completions, setCompletions] = useState<ShiftQuestCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);

  const today = getEffectiveGameDate();

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('gamification_shift_quest_assignments')
      .select(`
        *,
        quest:gamification_quests (*)
      `)
      .eq('date', today)
      .order('shift', { ascending: true });

    if (error) {
      console.error('Error fetching admin shift assignments:', error);
    } else {
      setAssignments((data as any) || []);
    }
    setIsLoading(false);
  }, [today]);

  const fetchCompletions = useCallback(async () => {
    // Fetch all pending shift completions for today
    const assignmentIds = assignments.map(a => a.id);
    if (assignmentIds.length === 0) {
      setCompletions([]);
      return;
    }

    const { data, error } = await supabase
      .from('gamification_shift_quest_completions')
      .select(`
        *,
        profile:profiles!gamification_shift_quest_completions_chatter_id_fkey (name)
      `)
      .in('shift_assignment_id', assignmentIds)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching shift completions:', error);
    } else {
      setCompletions((data as any) || []);
    }
  }, [assignments]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    if (assignments.length > 0) {
      fetchCompletions();
    }
  }, [assignments, fetchCompletions]);

  // Assign a quest to all 3 shifts for today
  const assignQuestToShifts = useCallback(async (questId: string) => {
    if (!user) return false;

    setIsAssigning(true);
    try {
      const rows = SHIFT_DEPARTMENTS.map(shift => ({
        quest_id: questId,
        shift,
        date: today,
        created_by: user.id,
      }));

      const { error } = await supabase
        .from('gamification_shift_quest_assignments')
        .insert(rows);

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Already Assigned', description: 'This quest is already assigned for today.', variant: 'destructive' });
        } else {
          throw error;
        }
        return false;
      }

      toast({ title: 'Success', description: 'Shift quest assigned to all shifts for today!' });
      fetchAssignments();
      return true;
    } catch (error) {
      console.error('Error assigning shift quest:', error);
      toast({ title: 'Error', description: 'Failed to assign shift quest', variant: 'destructive' });
      return false;
    } finally {
      setIsAssigning(false);
    }
  }, [user, today, toast, fetchAssignments]);

  const removeAssignment = useCallback(async (questId: string) => {
    try {
      const { error } = await supabase
        .from('gamification_shift_quest_assignments')
        .delete()
        .eq('quest_id', questId)
        .eq('date', today);

      if (error) throw error;

      toast({ title: 'Success', description: 'Shift quest removed from all shifts' });
      fetchAssignments();
    } catch (error) {
      console.error('Error removing shift assignment:', error);
      toast({ title: 'Error', description: 'Failed to remove shift quest', variant: 'destructive' });
    }
  }, [today, toast, fetchAssignments]);

  const verifyCompletion = useCallback(async (completionId: string, approve: boolean) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('gamification_shift_quest_completions')
        .update({
          status: approve ? 'verified' : 'rejected',
          verified_by: user.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', completionId);

      if (error) throw error;

      toast({ title: approve ? 'Approved' : 'Rejected', description: `Submission ${approve ? 'approved' : 'rejected'} successfully.` });
      fetchCompletions();
      return true;
    } catch (error) {
      console.error('Error verifying shift completion:', error);
      toast({ title: 'Error', description: 'Failed to update submission', variant: 'destructive' });
      return false;
    }
  }, [user, toast, fetchCompletions]);

  return {
    assignments,
    completions,
    isLoading,
    isAssigning,
    today,
    assignQuestToShifts,
    removeAssignment,
    verifyCompletion,
    refetch: fetchAssignments,
  };
}
