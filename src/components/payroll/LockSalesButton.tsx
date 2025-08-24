import React from 'react';
import { Button } from '@/components/ui/button';
import { Lock, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LockSalesButtonProps {
  chatterId?: string;
  selectedWeek: Date;
  isSalesLocked: boolean;
  isCurrentWeek: boolean;
  canEdit: boolean;
  onDataRefresh: () => void;
}

export const LockSalesButton: React.FC<LockSalesButtonProps> = ({
  chatterId,
  selectedWeek,
  isSalesLocked,
  isCurrentWeek,
  canEdit,
  onDataRefresh
}) => {
  const { user, userRole, userRoles } = useAuth();
  const { toast } = useToast();
  
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
    if (!effectiveChatterId || !isCurrentWeek) return;

    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      
      // Lock both sales and attendance
      const { error } = await supabase
        .from('sales_tracker')
        .update({ sales_locked: true })
        .eq('chatter_id', effectiveChatterId)
        .eq('week_start_date', weekStartStr);

      if (error) throw error;

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

  // Show lock button for current week only
  if (!isCurrentWeek) return null;

  return (
    <div className="mt-6 pt-6 border-t border-muted">
      <div className="flex justify-center">
        {isSalesLocked ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-green-600">
              <Lock className="h-4 w-4" />
              <span className="text-sm font-medium">Sales & Attendance Locked</span>
            </div>
            {(isAdmin || canApprovePayroll) && (
              <Button
                variant="destructive"
                size="sm"
                onClick={rejectPayroll}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Reject & Unlock
              </Button>
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
  );
};