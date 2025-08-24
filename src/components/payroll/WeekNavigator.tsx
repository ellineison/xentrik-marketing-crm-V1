import React from 'react';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from 'date-fns';

interface WeekNavigatorProps {
  selectedWeek?: Date;
  onWeekChange?: (date: Date) => void;
}

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  selectedWeek = new Date(),
  onWeekChange
}) => {
  // Calculate week start (Thursday) and end (Wednesday)
  const getWeekStart = (date: Date) => {
    const day = date.getDay();
    const thursday = new Date(date);
    
    if (day === 0) { // Sunday
      thursday.setDate(date.getDate() - 3);
    } else if (day < 4) { // Monday, Tuesday, Wednesday
      thursday.setDate(date.getDate() - day - 3);
    } else { // Thursday, Friday, Saturday
      thursday.setDate(date.getDate() - day + 4);
    }
    
    return thursday;
  };

  const weekStart = getWeekStart(selectedWeek);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

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