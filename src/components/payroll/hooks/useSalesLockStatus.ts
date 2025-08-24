import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export const useSalesLockStatus = (chatterId?: string, selectedWeek?: Date, refreshTrigger?: number) => {
  const [isSalesLocked, setIsSalesLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate week start (Thursday)
  const getWeekStart = (date: Date) => {
    const day = date.getDay();
    const thursday = new Date(date);
    thursday.setHours(0, 0, 0, 0);
    
    if (day === 0) { // Sunday
      thursday.setDate(date.getDate() - 3);
    } else if (day === 1) { // Monday
      thursday.setDate(date.getDate() - 4);
    } else if (day === 2) { // Tuesday
      thursday.setDate(date.getDate() - 5);
    } else if (day === 3) { // Wednesday
      thursday.setDate(date.getDate() - 6);
    } else if (day === 4) { // Thursday
      thursday.setDate(date.getDate());
    } else if (day === 5) { // Friday
      thursday.setDate(date.getDate() - 1);
    } else if (day === 6) { // Saturday
      thursday.setDate(date.getDate() - 2);
    }
    
    return thursday;
  };

  useEffect(() => {
    const fetchSalesLockStatus = async () => {
      if (!chatterId || !selectedWeek) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const weekStart = getWeekStart(selectedWeek);
        const weekStartStr = format(weekStart, 'yyyy-MM-dd');

        const { data, error } = await supabase
          .from('sales_tracker')
          .select('sales_locked')
          .eq('chatter_id', chatterId)
          .eq('week_start_date', weekStartStr)
          .limit(1);

        if (error) throw error;

        const isLocked = data && data.length > 0 ? data[0].sales_locked : false;
        setIsSalesLocked(isLocked || false);
      } catch (error) {
        console.error('Error fetching sales lock status:', error);
        setIsSalesLocked(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesLockStatus();
  }, [chatterId, selectedWeek, refreshTrigger]);

  return { isSalesLocked, isLoading };
};