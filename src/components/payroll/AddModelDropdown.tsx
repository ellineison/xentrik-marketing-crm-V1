import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown } from 'lucide-react';
import { useCreators } from '@/context/creator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AddModelDropdownProps {
  chatterId?: string;
  weekStart: Date;
  onModelAdded: () => void;
  disabled?: boolean;
}

export const AddModelDropdown: React.FC<AddModelDropdownProps> = ({
  chatterId,
  weekStart,
  onModelAdded,
  disabled = false
}) => {
  const { creators } = useCreators();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [availableCreators, setAvailableCreators] = useState<typeof creators>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && chatterId) {
      fetchAvailableCreators();
    }
  }, [isOpen, chatterId, weekStart]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      
      // Filter out creators whose model names are already added and sort alphabetically
      const available = creators
        .filter(creator => 
          creator.modelName && !existingModelNames.has(creator.modelName)
        )
        .sort((a, b) => (a.modelName || '').localeCompare(b.modelName || ''));
      
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

  const handleAddModel = async (creatorId: string) => {
    if (!chatterId) return;

    const selectedCreator = creators.find(c => c.id === creatorId);
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
      setIsOpen(false);
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

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className="flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Model
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 z-50 min-w-[200px] bg-background border border-border rounded-lg shadow-lg">
          <div className="py-2 max-h-60 overflow-y-auto">
            {availableCreators.length === 0 ? (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                No available models
              </div>
            ) : (
              availableCreators.map((creator) => (
                <button
                  key={creator.id}
                  onClick={() => handleAddModel(creator.id)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creator.modelName}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};