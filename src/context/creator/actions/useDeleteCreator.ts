
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
      console.log(`Deleting creator with ID: ${creatorId}`);

      // Call the edge function to delete the creator and all related records
      const { data, error } = await supabase.functions.invoke('delete-creator', {
        body: { creatorId }
      });

      if (error) {
        throw new Error(`Error deleting creator: ${error.message}`);
      }

      if (data?.error) {
        throw new Error(`Error deleting creator: ${data.error}`);
      }

      // Update local state
      setCreators(creators.filter(creator => creator.id !== creatorId));
      
      // Add activity log
      addActivity("delete", `Creator deleted`, creatorId);

      // Invalidate React Query cache to refresh Model Profile table
      queryClient.invalidateQueries({ queryKey: ['accepted-creator-submissions'] });

      toast({
        title: "Success",
        description: "Creator and all related records successfully removed",
      });

      return true;
    } catch (error) {
      console.error("Error deleting creator:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred while deleting the creator",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteCreator, isDeleting };
};
