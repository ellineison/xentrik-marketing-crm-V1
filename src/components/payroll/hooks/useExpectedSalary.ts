import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { getWeekStart } from '@/utils/weekCalculations';

const getCommissionRate = (totalSales: number): number => {
  if (totalSales >= 2000) return 3;
  if (totalSales >= 1500) return 2;
  if (totalSales >= 1000) return 1;
  return 0;
};

export const useExpectedSalary = (
  chatterId?: string,
  selectedWeek?: Date,
  isSalesLocked?: boolean,
  isAdminConfirmed?: boolean,
  department?: string | null,
  userRole?: string | null,
  userRoles?: string[] | null
) => {
  const [expectedSalary, setExpectedSalary] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const calculate = async () => {
      // Only show expected salary when locked but not yet admin confirmed
      if (!chatterId || !selectedWeek || !isSalesLocked) {
        setExpectedSalary(null);
        return;
      }

      setIsLoading(true);
      try {
        const weekStart = getWeekStart(selectedWeek, department, userRole, userRoles);
        const weekStartStr = format(weekStart, 'yyyy-MM-dd');

        // Fetch sales, attendance, and hourly rate in parallel
        const [salesResult, attendanceResult, profileResult] = await Promise.all([
          supabase
            .from('sales_tracker')
            .select('earnings')
            .eq('chatter_id', chatterId)
            .eq('week_start_date', weekStartStr),
          supabase
            .from('attendance')
            .select('day_of_week, attendance')
            .eq('chatter_id', chatterId)
            .eq('week_start_date', weekStartStr),
          supabase
            .from('profiles')
            .select('hourly_rate')
            .eq('id', chatterId)
            .single(),
        ]);

        const totalSales = salesResult.data?.reduce((sum, e) => sum + (e.earnings || 0), 0) || 0;

        // Count unique days with attendance
        const daysWithAttendance = new Set<number>();
        attendanceResult.data?.forEach(entry => {
          if (entry.attendance) {
            daysWithAttendance.add(entry.day_of_week);
          }
        });
        const hoursWorked = daysWithAttendance.size * 8;
        const hourlyRate = profileResult.data?.hourly_rate || 0;

        const commissionRate = getCommissionRate(totalSales);
        const hourlyPay = hoursWorked * hourlyRate;
        const commissionAmount = (totalSales * commissionRate) / 100;

        setExpectedSalary(hourlyPay + commissionAmount);
      } catch (error) {
        console.error('Error calculating expected salary:', error);
        setExpectedSalary(null);
      } finally {
        setIsLoading(false);
      }
    };

    calculate();
  }, [chatterId, selectedWeek, isSalesLocked, isAdminConfirmed, department, userRole, userRoles]);

  return { expectedSalary, isLoading };
};
