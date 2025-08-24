import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreators } from '@/context/creator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface AddModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatterId?: string;
  weekStart: Date;
  onModelAdded: () => void;
}

export const AddModelDialog: React.FC<AddModelDialogProps> = ({
  open,
  onOpenChange,
  chatterId,
  weekStart,
  onModelAdded
}) => {
  const { creators } = useCreators();
  const { toast } = useToast();
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>('');
  const [availableCreators, setAvailableCreators] = useState<typeof creators>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && chatterId) {
      fetchAvailableCreators();
    }
  }, [open, chatterId, weekStart]);

  const fetchAvailableCreators = async () => {
    if (!chatterId) return;

    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      
      // Get models already added for this week
      const { data: existingModels, error } = await supabase
        .from('sales_tracker')
        .select('model_name')
        .eq('chatter_id', chatterId)
        .eq('week_start_date', weekStartStr);

      if (error) throw error;

      const existingModelNames = new Set(existingModels?.map(m => m.model_name) || []);
      
      // Filter out creators whose model names are already added
      const available = creators.filter(creator => 
        creator.modelName && !existingModelNames.has(creator.modelName)
      );
      
      setAvailableCreators(available);
    } catch (error) {
      console.error('Error fetching available creators:', error);
      toast({
        title: "Error",
        description: "Failed to load available models",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCreatorId || !chatterId) return;

    const selectedCreator = creators.find(c => c.id === selectedCreatorId);
    if (!selectedCreator?.modelName) return;

    setIsLoading(true);
    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      
      // Add entries for all days of the week (Thursday=4 to Wednesday=3)
      const daysOfWeek = [4, 5, 6, 0, 1, 2, 3];
      const insertData = daysOfWeek.map(dayOfWeek => ({
        model_name: selectedCreator.modelName,
        day_of_week: dayOfWeek,
        earnings: 0,
        week_start_date: weekStartStr,
        chatter_id: chatterId,
        working_day: true
      }));

      const { error } = await supabase
        .from('sales_tracker')
        .insert(insertData);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedCreator.modelName} added to payroll`,
      });

      onModelAdded();
      handleDialogChange(false);
    } catch (error) {
      console.error('Error adding model:', error);
      toast({
        title: "Error",
        description: "Failed to add model",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setSelectedCreatorId('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Model to Payroll</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Select value={selectedCreatorId} onValueChange={setSelectedCreatorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {availableCreators.length === 0 ? (
                  <SelectItem value="" disabled>
                    No available models
                  </SelectItem>
                ) : (
                  availableCreators.map((creator) => (
                    <SelectItem key={creator.id} value={creator.id}>
                      {creator.modelName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedCreatorId || isLoading}
              className="flex-1"
            >
              {isLoading ? "Adding..." : "Add Model"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};