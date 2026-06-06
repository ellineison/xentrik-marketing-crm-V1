import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { getWeekStart } from '@/utils/weekCalculations';

const getCommissionRate = (totalSales: number): number => {
  if (totalSales >= 2000) return 3;
  if (totalSales >= 1500) return 2;
  if (totalSales >= 1000) return 1;
  return 0;
};

export interface PayrollSummary {
  id?: string;
  chatter_id: string;
  week_start_date: string;
  locked_total_sales: number;
  locked_hours_worked: number;
  locked_hourly_rate: number;
  locked_commission_rate: number;
  locked_hourly_pay: number;
  locked_commission_amount: number;
  expected_salary: number;
  locked_at?: string | null;
  overtime_pay?: number | null;
  overtime_notes?: string | null;
  bonus_amount?: number | null;
  bonus_notes?: string | null;
  deduction_amount?: number | null;
  deduction_notes?: string | null;
  approved_salary?: number | null;
  approved_at?: string | null;
  approved_by?: string | null;
}

/**
 * Reads the snapshot row from payroll_summaries.
 * Falls back to live computation when no snapshot exists (legacy weeks
 * locked before this feature shipped) so old records still display.
 */
export const usePayrollSummary = (
  chatterId?: string,
  selectedWeek?: Date,
  isSalesLocked?: boolean,
  department?: string | null,
  userRole?: string | null,
  userRoles?: string[] | null,
  refreshKey?: number
) => {
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [expectedSalary, setExpectedSalary] = useState<number | null>(null);
  const [approvedSalary, setApprovedSalary] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!chatterId || !selectedWeek || !isSalesLocked) {
      setSummary(null);
      setExpectedSalary(null);
      setApprovedSalary(null);
      return;
    }

    setIsLoading(true);
    try {
      const weekStart = getWeekStart(selectedWeek, department, userRole, userRoles);
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');

      const { data: summaryRow } = await supabase
        .from('payroll_summaries')
        .select('*')
        .eq('chatter_id', chatterId)
        .eq('week_start_date', weekStartStr)
        .maybeSingle();

      if (summaryRow) {
        setSummary(summaryRow as PayrollSummary);
        setExpectedSalary(Number(summaryRow.expected_salary) || 0);
        setApprovedSalary(
          summaryRow.approved_salary !== null && summaryRow.approved_salary !== undefined
            ? Number(summaryRow.approved_salary)
            : null
        );
      } else {
        // Legacy fallback: live computation for weeks locked before snapshots existed
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

        const totalSales =
          salesResult.data?.reduce((sum, e) => sum + (e.earnings || 0), 0) || 0;
        const daysWithAttendance = new Set<number>();
        attendanceResult.data?.forEach((entry) => {
          if (entry.attendance) daysWithAttendance.add(entry.day_of_week);
        });
        const hoursWorked = daysWithAttendance.size * 8;
        const hourlyRate = profileResult.data?.hourly_rate || 0;
        const commissionRate = getCommissionRate(totalSales);
        const hourlyPay = hoursWorked * hourlyRate;
        const commissionAmount = (totalSales * commissionRate) / 100;
        const expected = hourlyPay + commissionAmount;

        setSummary(null);
        setExpectedSalary(expected);
        setApprovedSalary(null);
      }
    } catch (error) {
      console.error('Error loading payroll summary:', error);
      setSummary(null);
      setExpectedSalary(null);
      setApprovedSalary(null);
    } finally {
      setIsLoading(false);
    }
  }, [chatterId, selectedWeek, isSalesLocked, department, userRole, userRoles, refreshKey]);

  useEffect(() => {
    load();
  }, [load]);

  return { summary, expectedSalary, approvedSalary, isLoading, reload: load };
};

/**
 * Helper to compute and upsert the locked snapshot when chatter locks payroll.
 * Only writes the locked_* / expected_salary fields. Clears approval fields so
 * a re-lock after a rejection starts fresh.
 */
export const writeLockedPayrollSnapshot = async (
  chatterId: string,
  weekStartStr: string
) => {
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

  const totalSales =
    salesResult.data?.reduce((sum, e) => sum + (e.earnings || 0), 0) || 0;
  const daysWithAttendance = new Set<number>();
  attendanceResult.data?.forEach((entry) => {
    if (entry.attendance) daysWithAttendance.add(entry.day_of_week);
  });
  const hoursWorked = daysWithAttendance.size * 8;
  const hourlyRate = profileResult.data?.hourly_rate || 0;
  const commissionRate = getCommissionRate(totalSales);
  const hourlyPay = hoursWorked * hourlyRate;
  const commissionAmount = (totalSales * commissionRate) / 100;
  const expectedSalary = hourlyPay + commissionAmount;

  const payload = {
    chatter_id: chatterId,
    week_start_date: weekStartStr,
    locked_total_sales: totalSales,
    locked_hours_worked: hoursWorked,
    locked_hourly_rate: hourlyRate,
    locked_commission_rate: commissionRate,
    locked_hourly_pay: hourlyPay,
    locked_commission_amount: commissionAmount,
    expected_salary: expectedSalary,
    locked_at: new Date().toISOString(),
    // Clear any prior approval (handles re-lock after rejection)
    overtime_pay: null,
    overtime_notes: null,
    bonus_amount: null,
    bonus_notes: null,
    deduction_amount: null,
    deduction_notes: null,
    approved_salary: null,
    approved_at: null,
    approved_by: null,
  };

  const { error } = await supabase
    .from('payroll_summaries')
    .upsert(payload, { onConflict: 'chatter_id,week_start_date' });

  if (error) throw error;
  return payload;
};
