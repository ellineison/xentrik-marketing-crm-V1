import React from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getWeekStart, getWeekEnd } from '@/utils/weekCalculations';

interface WeekPickerProps {
  selectedWeekStart: Date;
  onWeekChange: (weekStart: Date) => void;
}

export function WeekPicker({ selectedWeekStart, onWeekChange }: WeekPickerProps) {
  const weekEnd = getWeekEnd(selectedWeekStart);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const newWeekStart = getWeekStart(date);
      onWeekChange(newWeekStart);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    onWeekChange(newDate);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => navigateWeek('prev')}
        className="h-9 w-9"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "min-w-[240px] justify-start text-left font-normal",
              "hover:bg-accent"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>
              {format(selectedWeekStart, 'MMM d, yyyy')} - {format(weekEnd, 'MMM d, yyyy')}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedWeekStart}
            onSelect={handleDateSelect}
            initialFocus
            className="pointer-events-auto"
          />
          <div className="p-3 border-t text-xs text-muted-foreground">
            Week cutoff: Thursday - Wednesday
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        onClick={() => navigateWeek('next')}
        className="h-9 w-9"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
