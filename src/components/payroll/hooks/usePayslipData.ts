import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface PayslipPayload {
  chatterName: string;
  weekStart: Date;
  weekEnd: Date;
  salesData: { model_name: string; day_of_week: number; earnings: number }[];
  totalSales: number;
  hoursWorked: number;
  hourlyRate: number;
  commissionRate: number;
  commissionAmount: number;
  overtimePay: number;
  overtimeNotes: string;
  bonusAmount: number;
  bonusNotes: string;
  deductionAmount: number;
  deductionNotes: string;
  expectedSalary: number;
  approvedSalary: number | null;
  totalPayout: number;
}

const getCommissionRate = (totalSales: number): number => {
  if (totalSales >= 2000) return 3;
  if (totalSales >= 1500) return 2;
  if (totalSales >= 1000) return 1;
  return 0;
};

/**
 * Builds payslip data. Uses payroll_summaries as the source of truth when
 * present; falls back to legacy sales_tracker.confirmed_* + profiles.hourly_rate
 * for weeks locked before snapshots existed.
 */
export const buildPayslipData = async (
  chatterId: string,
  weekStart: Date
): Promise<PayslipPayload | null> => {
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

  const [summaryRes, salesRes, profileRes] = await Promise.all([
    supabase
      .from('payroll_summaries')
      .select('*')
      .eq('chatter_id', chatterId)
      .eq('week_start_date', weekStartStr)
      .maybeSingle(),
    supabase
      .from('sales_tracker')
      .select('*')
      .eq('chatter_id', chatterId)
      .eq('week_start_date', weekStartStr),
    supabase
      .from('profiles')
      .select('name, hourly_rate')
      .eq('id', chatterId)
      .single(),
  ]);

  if (!profileRes.data) return null;
  const salesRows = salesRes.data || [];
  const salesData = salesRows.map((e: any) => ({
    model_name: e.model_name,
    day_of_week: e.day_of_week,
    earnings: e.earnings,
  }));

  const summary = summaryRes.data as any | null;

  if (summary) {
    const overtimePay = Number(summary.overtime_pay) || 0;
    const bonusAmount = Number(summary.bonus_amount) || 0;
    const deductionAmount = Number(summary.deduction_amount) || 0;
    const expectedSalary = Number(summary.expected_salary) || 0;
    const approvedSalary =
      summary.approved_salary !== null && summary.approved_salary !== undefined
        ? Number(summary.approved_salary)
        : null;

    const totalPayout =
      approvedSalary !== null
        ? approvedSalary
        : expectedSalary + overtimePay + bonusAmount - deductionAmount;

    return {
      chatterName: profileRes.data.name,
      weekStart,
      weekEnd,
      salesData,
      totalSales: Number(summary.locked_total_sales) || 0,
      hoursWorked: Number(summary.locked_hours_worked) || 0,
      hourlyRate: Number(summary.locked_hourly_rate) || 0,
      commissionRate: Number(summary.locked_commission_rate) || 0,
      commissionAmount: Number(summary.locked_commission_amount) || 0,
      overtimePay,
      overtimeNotes: summary.overtime_notes || '',
      bonusAmount,
      bonusNotes: summary.bonus_notes || '',
      deductionAmount,
      deductionNotes: summary.deduction_notes || '',
      expectedSalary,
      approvedSalary,
      totalPayout,
    };
  }

  // Legacy fallback for weeks locked before payroll_summaries existed.
  if (!salesRows.length) return null;
  const firstEntry: any = salesRows[0];
  const totalSales = salesRows.reduce(
    (sum: number, e: any) => sum + (e.earnings || 0),
    0
  );
  const hoursWorked = Number(firstEntry.confirmed_hours_worked) || 0;
  const hourlyRate = Number(profileRes.data.hourly_rate) || 0;
  const commissionRate =
    Number(firstEntry.confirmed_commission_rate) || getCommissionRate(totalSales);
  const commissionAmount = (totalSales * commissionRate) / 100;
  const hourlyPay = hoursWorked * hourlyRate;
  const expectedSalary = hourlyPay + commissionAmount;
  const overtimePay = Number(firstEntry.overtime_pay) || 0;
  const deductionAmount = Number(firstEntry.deduction_amount) || 0;
  const totalPayout = expectedSalary + overtimePay - deductionAmount;

  return {
    chatterName: profileRes.data.name,
    weekStart,
    weekEnd,
    salesData,
    totalSales,
    hoursWorked,
    hourlyRate,
    commissionRate,
    commissionAmount,
    overtimePay,
    overtimeNotes: firstEntry.overtime_notes || '',
    bonusAmount: 0,
    bonusNotes: '',
    deductionAmount,
    deductionNotes: firstEntry.deduction_notes || '',
    expectedSalary,
    approvedSalary: null,
    totalPayout,
  };
};
