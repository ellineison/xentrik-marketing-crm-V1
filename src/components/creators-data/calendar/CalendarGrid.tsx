import React from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Schedule } from './types';

interface CalendarGridProps {
  currentDate: Date;
  schedules: Schedule[];
  onDayClick: (date: Date) => void;
  onScheduleClick: (schedule: Schedule) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  schedules,
  onDayClick,
  onScheduleClick,
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getSchedulesForDay = (day: Date) => {
    return schedules.filter((schedule) => {
      const start = parseISO(schedule.start_time);
      const end = parseISO(schedule.end_time);
      return (
        isSameDay(start, day) ||
        isSameDay(end, day) ||
        (start < day && end > day)
      );
    });
  };

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 bg-muted/50">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-xs font-medium text-muted-foreground border-b"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const daySchedules = getSchedulesForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={index}
              onClick={() => onDayClick(day)}
              className={cn(
                "min-h-[80px] sm:min-h-[100px] p-1 border-b border-r cursor-pointer transition-colors hover:bg-muted/30",
                !isCurrentMonth && "bg-muted/20",
                "last:border-r-0 [&:nth-child(7n)]:border-r-0"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-6 h-6 text-xs rounded-full",
                    isCurrentDay && "bg-primary text-primary-foreground font-bold",
                    !isCurrentMonth && "text-muted-foreground"
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Schedule Events */}
              <div className="space-y-0.5 overflow-hidden">
                {daySchedules.slice(0, 3).map((schedule) => (
                  <div
                    key={schedule.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onScheduleClick(schedule);
                    }}
                    className="text-[10px] sm:text-xs px-1 py-0.5 rounded truncate text-white cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: schedule.color }}
                    title={schedule.title}
                  >
                    {schedule.all_day ? (
                      schedule.title
                    ) : (
                      <>
                        <span className="hidden sm:inline">
                          {format(parseISO(schedule.start_time), 'h:mm a')} -{' '}
                        </span>
                        {schedule.title}
                      </>
                    )}
                  </div>
                ))}
                {daySchedules.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1">
                    +{daySchedules.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;
