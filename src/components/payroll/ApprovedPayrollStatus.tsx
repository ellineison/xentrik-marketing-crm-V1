import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Download } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generatePayslipPDF } from './PayslipGenerator';
import { getWeekStart } from '@/utils/weekCalculations';
import { useState, useEffect } from 'react';

interface ApprovedPayrollStatusProps {
  chatterId?: string;
  selectedWeek: Date;
  isAdminConfirmed: boolean;
  show: boolean;
}

export const ApprovedPayrollStatus: React.FC<ApprovedPayrollStatusProps> = ({
  chatterId,
  selectedWeek,
  isAdminConfirmed,
  show
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chatterDepartment, setChatterDepartment] = useState<string | null>(null);
  
  const effectiveChatterId = chatterId || user?.id;

  // Fetch chatter's department
  useEffect(() => {
    const fetchDepartment = async () => {
      if (!effectiveChatterId) return;
      const { data } = await supabase
        .from('profiles')
        .select('department')
        .eq('id', effectiveChatterId)
        .single();
      setChatterDepartment(data?.department || null);
    };
    fetchDepartment();
  }, [effectiveChatterId]);

  // Calculate week start based on chatter's department
  const weekStart = getWeekStart(selectedWeek, chatterDepartment);

  const downloadPayslip = async () => {
    if (!effectiveChatterId) return;

    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      
      // Fetch sales data and payroll details
      const { data: salesData, error: salesError } = await supabase
        .from('sales_tracker')
        .select('*')
        .eq('chatter_id', effectiveChatterId)
        .eq('week_start_date', weekStartStr);

      if (salesError) throw salesError;

      // Get chatter profile info
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name, hourly_rate')
        .eq('id', effectiveChatterId)
        .single();

      if (profileError) throw profileError;

      if (!salesData?.length || !profileData) {
        toast({
          title: "Error",
          description: "No payroll data found for this week",
          variant: "destructive",
        });
        return;
      }

      const firstEntry = salesData[0];
      const totalSales = salesData.reduce((sum, entry) => sum + (entry.earnings || 0), 0);
      
      // Calculate commission amount and total payout
      const commissionRate = firstEntry.confirmed_commission_rate || 0;
      const hoursWorked = firstEntry.confirmed_hours_worked || 0;
      const hourlyRate = profileData.hourly_rate || 0;
      const overtimePay = firstEntry.overtime_pay || 0;
      const deductionAmount = firstEntry.deduction_amount || 0;
      
      const commissionAmount = (totalSales * commissionRate) / 100;
      const hourlyPay = hoursWorked * hourlyRate;
      const totalPayout = hourlyPay + commissionAmount + overtimePay - deductionAmount;

      // Prepare payslip data
      const payslipData = {
        chatterName: profileData.name,
        weekStart: weekStart,
        weekEnd: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
        salesData: salesData.map(entry => ({
          model_name: entry.model_name,
          day_of_week: entry.day_of_week,
          earnings: entry.earnings
        })),
        totalSales: totalSales,
        hoursWorked: hoursWorked,
        hourlyRate: hourlyRate,
        commissionRate: commissionRate,
        commissionAmount: commissionAmount,
        overtimePay: overtimePay,
        overtimeNotes: firstEntry.overtime_notes || '',
        deductionAmount: deductionAmount,
        deductionNotes: firstEntry.deduction_notes || '',
        totalPayout: totalPayout
      };

      generatePayslipPDF(payslipData);

      toast({
        title: "Payslip Downloaded",
        description: "Payslip has been generated and downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating payslip:', error);
      toast({
        title: "Error",
        description: "Failed to generate payslip",
        variant: "destructive",
      });
    }
  };

  if (!show || !isAdminConfirmed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-muted p-4 z-50">
      <div className="container mx-auto">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-blue-600">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Approved by HR</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadPayslip}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Payslip
          </Button>
        </div>
      </div>
    </div>
  );
};