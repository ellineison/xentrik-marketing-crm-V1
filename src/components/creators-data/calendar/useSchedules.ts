import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Schedule, ScheduleFormData } from './types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

export const useSchedules = (creatorId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const schedulesQuery = useQuery({
    queryKey: ['model-schedules', creatorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('model_schedules')
        .select('*')
        .eq('creator_id', creatorId)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching schedules:', error);
        throw error;
      }

      return data as Schedule[];
    },
    enabled: !!creatorId,
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (formData: ScheduleFormData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('model_schedules')
        .insert({
          creator_id: creatorId,
          title: formData.title,
          description: formData.description || null,
          start_time: formData.start_time.toISOString(),
          end_time: formData.end_time.toISOString(),
          all_day: formData.all_day,
          color: formData.color,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating schedule:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-schedules', creatorId] });
      toast({
        title: 'Schedule Created',
        description: 'The schedule has been added successfully.',
      });
    },
    onError: (error) => {
      console.error('Failed to create schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to create schedule. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: ScheduleFormData }) => {
      const { data, error } = await supabase
        .from('model_schedules')
        .update({
          title: formData.title,
          description: formData.description || null,
          start_time: formData.start_time.toISOString(),
          end_time: formData.end_time.toISOString(),
          all_day: formData.all_day,
          color: formData.color,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating schedule:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-schedules', creatorId] });
      toast({
        title: 'Schedule Updated',
        description: 'The schedule has been updated successfully.',
      });
    },
    onError: (error) => {
      console.error('Failed to update schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update schedule. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('model_schedules')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting schedule:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-schedules', creatorId] });
      toast({
        title: 'Schedule Deleted',
        description: 'The schedule has been removed successfully.',
      });
    },
    onError: (error) => {
      console.error('Failed to delete schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete schedule. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    schedules: schedulesQuery.data || [],
    isLoading: schedulesQuery.isLoading,
    error: schedulesQuery.error,
    createSchedule: createScheduleMutation.mutate,
    updateSchedule: updateScheduleMutation.mutate,
    deleteSchedule: deleteScheduleMutation.mutate,
    isCreating: createScheduleMutation.isPending,
    isUpdating: updateScheduleMutation.isPending,
    isDeleting: deleteScheduleMutation.isPending,
  };
};
