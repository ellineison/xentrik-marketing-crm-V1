import React from 'react';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { getWeekStart, getWeekEnd } from '@/utils/weekCalculations';

interface WeekNavigatorProps {
  selectedWeek?: Date;
  onWeekChange?: (date: Date) => void;
}

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  selectedWeek = new Date(),
  onWeekChange
}) => {
  // Use standard cutoff for navigation (most common case)
  const weekStart = getWeekStart(selectedWeek);
  const weekEnd = getWeekEnd(weekStart);

  const handlePreviousWeek = () => {
    const newWeek = subWeeks(weekStart, 1);
    onWeekChange?.(newWeek);
  };

  const handleNextWeek = () => {
    const newWeek = addWeeks(weekStart, 1);
    onWeekChange?.(newWeek);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const newWeekStart = getWeekStart(date);
      onWeekChange?.(newWeekStart);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePreviousWeek}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={weekStart}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="sm"
        onClick={handleNextWeek}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};