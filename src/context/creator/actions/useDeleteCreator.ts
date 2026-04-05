
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Creator } from "@/types";
import { useQueryClient } from "@tanstack/react-query";

export const useDeleteCreator = (
  creators: Creator[],
  setCreators: React.Dispatch<React.SetStateAction<Creator[]>>,
  addActivity: (action: string, description: string, creatorId: string) => void
) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteCreator = async (creatorId: string) => {
    if (!creatorId) {
      toast({
        title: "Error",
        description: "Creator ID is required",
        variant: "destructive",
      });
      return false;
    }

    setIsDeleting(true);

    try {
      console.log(`Archiving creator with ID: ${creatorId}`);

      // Archive instead of permanently deleting — set active to false
      const { error } = await supabase
        .from('creators')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('id', creatorId);

      if (error) {
        throw new Error(`Error archiving creator: ${error.message}`);
      }

      // Update local state — remove from active list
      setCreators(creators.filter(creator => creator.id !== creatorId));
      
      // Add activity log
      addActivity("archive", `Creator archived`, creatorId);

      // Invalidate React Query cache to refresh Model Profile table
      queryClient.invalidateQueries({ queryKey: ['accepted-creator-submissions'] });

      toast({
        title: "Success",
        description: "Creator has been archived. You can restore them later from the archived list.",
      });

      return true;
    } catch (error) {
      console.error("Error archiving creator:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred while archiving the creator",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  // Restore an archived creator
  const restoreCreator = async (creatorId: string) => {
    try {
      const { error } = await supabase
        .from('creators')
        .update({ active: true, updated_at: new Date().toISOString() })
        .eq('id', creatorId);

      if (error) throw error;

      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: ['accepted-creator-submissions'] });

      toast({
        title: "Success",
        description: "Creator has been restored and is now active again.",
      });

      return true;
    } catch (error) {
      console.error("Error restoring creator:", error);
      toast({
        title: "Error",
        description: "Failed to restore creator",
        variant: "destructive",
      });
      return false;
    }
  };

  return { deleteCreator, restoreCreator, isDeleting };
};
