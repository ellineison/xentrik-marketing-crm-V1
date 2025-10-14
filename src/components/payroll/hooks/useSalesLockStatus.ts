import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { getWeekStart } from '@/utils/weekCalculations';

export const useSalesLockStatus = (chatterId?: string, selectedWeek?: Date, refreshTrigger?: number) => {
  const [isSalesLocked, setIsSalesLocked] = useState(false);
  const [isAdminConfirmed, setIsAdminConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [chatterDepartment, setChatterDepartment] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalesLockStatus = async () => {
      if (!chatterId || !selectedWeek) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch chatter's department first
        const { data: profileData } = await supabase
          .from('profiles')
          .select('department')
          .eq('id', chatterId)
          .single();
        
        const department = profileData?.department || null;
        setChatterDepartment(department);
        
        const weekStart = getWeekStart(selectedWeek, department);
        const weekStartStr = format(weekStart, 'yyyy-MM-dd');

        const { data, error } = await supabase
          .from('sales_tracker')
          .select('sales_locked, admin_confirmed')
          .eq('chatter_id', chatterId)
          .eq('week_start_date', weekStartStr)
          .limit(1);

        if (error) throw error;

        const isLocked = data && data.length > 0 ? data[0].sales_locked : false;
        const isConfirmed = data && data.length > 0 ? data[0].admin_confirmed : false;
        setIsSalesLocked(isLocked || false);
        setIsAdminConfirmed(isConfirmed || false);
      } catch (error) {
        console.error('Error fetching sales lock status:', error);
        setIsSalesLocked(false);
        setIsAdminConfirmed(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesLockStatus();
  }, [chatterId, selectedWeek, refreshTrigger]);

  return { isSalesLocked, isAdminConfirmed, isLoading };
};