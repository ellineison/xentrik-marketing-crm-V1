import { format } from 'date-fns';

/**
 * Get the effective game date for daily quests.
 * Daily quests reset at 10:00 PM (22:00) instead of midnight.
 * - Before 10 PM: returns today's date
 * - At/after 10 PM: returns tomorrow's date (quests assigned now belong to the next day)
 */
export const getEffectiveGameDate = (): string => {
  const now = new Date();
  const hours = now.getHours();
  
  if (hours >= 22) {
    // After 10 PM - this counts as the next day
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return format(tomorrow, 'yyyy-MM-dd');
  }
  
  return format(now, 'yyyy-MM-dd');
};

/**
 * Get the effective game date as a formatted display string.
 */
export const getEffectiveGameDateDisplay = (formatStr: string = 'MMM d, yyyy'): string => {
  const dateStr = getEffectiveGameDate();
  const [year, month, day] = dateStr.split('-').map(Number);
  return format(new Date(year, month - 1, day), formatStr);
};
