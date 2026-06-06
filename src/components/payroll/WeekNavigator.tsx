import React from 'react';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addWeeks, subWeeks } from 'date-fns';
import { getWeekStart, getWeekEnd } from '@/utils/weekCalculations';

interface WeekNavigatorProps {
  selectedWeek?: Date;
  onWeekChange?: (date: Date) => void;
  /**
   * Department of the chatter being viewed. Drives the week cutoff so that
   * 10PM (Team Nash) chatters see a Wednesday-Tuesday window in the picker,
   * while everyone else sees Thursday-Wednesday.
   */
  department?: string | null;
  role?: string | null;
  roles?: string[] | null;
}

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  selectedWeek = new Date(),
  onWeekChange,
  department,
  role,
  roles,
}) => {
  const weekStart = getWeekStart(selectedWeek, department, role, roles);
  const weekEnd = getWeekEnd(weekStart);

  const handlePreviousWeek = () => {
    onWeekChange?.(subWeeks(weekStart, 1));
  };

  const handleNextWeek = () => {
    onWeekChange?.(addWeeks(weekStart, 1));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onWeekChange?.(getWeekStart(date, department, role, roles));
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
