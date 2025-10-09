import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Lock, XCircle, Check, Download } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PayrollConfirmationModal } from './PayrollConfirmationModal';
import { generatePayslipPDF } from './PayslipGenerator';

interface LockSalesButtonProps {
  chatterId?: string;
  selectedWeek: Date;
  isSalesLocked: boolean;
  isAdminConfirmed: boolean;
  isCurrentWeek: boolean;
  canEdit: boolean;
  onDataRefresh: () => void;
  onRenderApprovedState?: (approvedStateElement: React.ReactNode) => void;
}

export const LockSalesButton: React.FC<LockSalesButtonProps> = ({
  chatterId,
  selectedWeek,
  isSalesLocked,
  isAdminConfirmed,
  isCurrentWeek,
  canEdit,
  onDataRefresh,
  onRenderApprovedState
}) => {
  const { user, userRole, userRoles } = useAuth();
  const { toast } = useToast();
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [totalSales, setTotalSales] = useState(0);
  const [currentHourlyRate, setCurrentHourlyRate] = useState(0);
  const [chatterName, setChatterName] = useState('');
  
  const effectiveChatterId = chatterId || user?.id;
  const isAdmin = userRole === 'Admin' || userRoles?.includes('Admin');
  const canApprovePayroll = userRole === 'HR / Work Force' || userRoles?.includes('HR / Work Force');

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

  const weekStart = getWeekStart(selectedWeek);

  const confirmWeekSales = async () => {
    if (!effectiveChatterId) return;

    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      
      // First, check if any sales data exists for this week
      const { data: existingData, error: checkError } = await supabase
        .from('sales_tracker')
        .select('id')
        .eq('chatter_id', effectiveChatterId)
        .eq('week_start_date', weekStartStr)
        .limit(1);

      if (checkError) throw checkError;

      // If no sales data exists, create placeholder entries for each day to enable locking
      if (!existingData || existingData.length === 0) {
        const placeholderEntries = [];
        for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
          placeholderEntries.push({
            chatter_id: effectiveChatterId,
            week_start_date: weekStartStr,
            day_of_week: dayOfWeek,
            model_name: 'No Models',
            earnings: 0,
            working_day: true,
            sales_locked: true
          });
        }

        const { error: insertError } = await supabase
          .from('sales_tracker')
          .insert(placeholderEntries);

        if (insertError) throw insertError;
      } else {
        // Lock existing sales data
        const { error } = await supabase
          .from('sales_tracker')
          .update({ sales_locked: true })
          .eq('chatter_id', effectiveChatterId)
          .eq('week_start_date', weekStartStr);

        if (error) throw error;
      }

      onDataRefresh(); // Refresh data
      toast({
        title: "Sales & Attendance Confirmed",
        description: "Your weekly sales and attendance have been locked and submitted for review.",
      });
    } catch (error) {
      console.error('Error confirming sales:', error);
      toast({
        title: "Error",
        description: "Failed to confirm sales and attendance",
        variant: "destructive",
      });
    }
  };

  const openPayrollModal = async () => {
    if (!effectiveChatterId || !canApprovePayroll) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to approve payroll.",
        variant: "destructive",
      });
      return;
    }

    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      
      // Fetch sales data to calculate total and get chatter info
      const { data: salesData, error: salesError } = await supabase
        .from('sales_tracker')
        .select('earnings')
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

      const calculatedTotalSales = salesData?.reduce((sum, entry) => sum + (entry.earnings || 0), 0) || 0;
      console.log('LockSalesButton: salesData:', salesData);
      console.log('LockSalesButton: calculatedTotalSales:', calculatedTotalSales);
      
      setTotalSales(calculatedTotalSales);
      setCurrentHourlyRate(profileData?.hourly_rate || 0);
      setChatterName(profileData?.name || '');
      setShowPayrollModal(true);
      
    } catch (error) {
      console.error('Error preparing payroll modal:', error);
      toast({
        title: "Error",
        description: "Failed to load payroll data",
        variant: "destructive",
      });
    }
  };

  const rejectPayroll = async () => {
    if (!effectiveChatterId || !canApprovePayroll) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to reject payroll.",
        variant: "destructive",
      });
      return;
    }

    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      
      // When rejecting payroll, reset sales_locked which also unlocks attendance
      const { error } = await supabase
        .from('sales_tracker')
        .update({ 
          sales_locked: false,
          admin_confirmed: false,
          confirmed_hours_worked: null,
          confirmed_commission_rate: null,
          overtime_pay: null,
          overtime_notes: null,
          deduction_amount: null,
          deduction_notes: null
        })
        .eq('chatter_id', effectiveChatterId)
        .eq('week_start_date', weekStartStr);

      if (error) throw error;

      onDataRefresh(); // Refresh data
      toast({
        title: "Payroll Rejected",
        description: "Sales and attendance have been unlocked for the chatter to review and resubmit.",
      });
    } catch (error) {
      console.error('Error rejecting payroll:', error);
      toast({
        title: "Error",
        description: "Failed to reject payroll",
        variant: "destructive",
      });
    }
  };

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

  // Show component if sales are locked and awaiting approval, or if they can edit
  // No longer restricted to current week only
  if (!canEdit && !(isSalesLocked && !isAdminConfirmed)) return null;

  return (
    <>
      <div className="mt-6 pt-6 border-t border-muted">
        <div className="flex justify-center">
          {isSalesLocked && !isAdminConfirmed ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-green-600">
                <Lock className="h-4 w-4" />
                <span className="text-sm font-medium">Sales & Attendance Locked - Waiting for HR Approval</span>
              </div>
              {(isAdmin || canApprovePayroll) && (
                <div className="flex items-center gap-3">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={rejectPayroll}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject & Unlock
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={openPayrollModal}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Approve Payroll
                  </Button>
                </div>
              )}
            </div>
          ) : (
            canEdit && (
              <Button
                onClick={confirmWeekSales}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
              >
                <Lock className="h-4 w-4" />
                Lock Sales & Attendance
              </Button>
            )
          )}
        </div>
      </div>

      <PayrollConfirmationModal
        open={showPayrollModal}
        onOpenChange={setShowPayrollModal}
        chatterName={chatterName}
        chatterId={effectiveChatterId || ''}
        weekStart={weekStart}
        totalSales={totalSales}
        currentHourlyRate={currentHourlyRate}
        onConfirmed={onDataRefresh}
      />
    </>
  );
};