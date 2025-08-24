import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PayrollConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatterName: string;
  chatterId: string;
  weekStart: Date;
  totalSales: number;
  currentHourlyRate: number;
  onConfirmed: () => void;
}

const getCommissionRate = (totalSales: number): number => {
  if (totalSales >= 2000) return 3;
  if (totalSales >= 1500) return 2;
  if (totalSales >= 1000) return 1;
  return 0;
};

export const PayrollConfirmationModal: React.FC<PayrollConfirmationModalProps> = ({
  open,
  onOpenChange,
  chatterName,
  chatterId,
  weekStart,
  totalSales,
  currentHourlyRate,
  onConfirmed,
}) => {
  const { toast } = useToast();
  const [hoursWorked, setHoursWorked] = useState<number>(0);
  const [overtimePay, setOvertimePay] = useState<number>(0);
  const [overtimeNotes, setOvertimeNotes] = useState<string>('');
  const [commissionRate, setCommissionRate] = useState<number>(getCommissionRate(totalSales));
  const [deductionAmount, setDeductionAmount] = useState<number>(0);
  const [deductionNotes, setDeductionNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

  // Fetch attendance data and calculate hours worked when modal opens
  useEffect(() => {
    if (open && chatterId) {
      fetchAttendanceAndCalculateHours();
    }
  }, [open, chatterId, weekStart]);

  const fetchAttendanceAndCalculateHours = async () => {
    setIsLoadingAttendance(true);
    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      
      // Fetch attendance data for the week
      const { data: salesData, error } = await supabase
        .from('sales_tracker')
        .select('day_of_week, attendance')
        .eq('chatter_id', chatterId)
        .eq('week_start_date', weekStartStr);

      if (error) throw error;

      // Count unique days with attendance = true
      const daysWithAttendance = new Set();
      salesData?.forEach(entry => {
        if (entry.attendance) {
          daysWithAttendance.add(entry.day_of_week);
        }
      });

      // Calculate hours: 8 hours per day with attendance
      const calculatedHours = daysWithAttendance.size * 8;
      setHoursWorked(calculatedHours);

    } catch (error) {
      console.error('Error fetching attendance data:', error);
      // Fallback to default 40 hours if error
      setHoursWorked(40);
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const commissionAmount = (totalSales * commissionRate) / 100;
  const hourlyPay = hoursWorked * currentHourlyRate;
  const totalPayout = hourlyPay + commissionAmount + overtimePay - deductionAmount;

  const handleConfirmPayroll = async () => {
    setIsProcessing(true);
    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');

      // Update all sales entries for this chatter and week with confirmation details
      const { error } = await supabase
        .from('sales_tracker')
        .update({
          admin_confirmed: true,
          confirmed_hours_worked: hoursWorked,
          confirmed_commission_rate: commissionRate,
          overtime_pay: overtimePay,
          overtime_notes: overtimeNotes || null,
          deduction_amount: deductionAmount,
          deduction_notes: deductionNotes || null,
        })
        .eq('chatter_id', chatterId)
        .eq('week_start_date', weekStartStr);

      if (error) throw error;

      toast({
        title: "Payroll Confirmed",
        description: `Payroll confirmed for ${chatterName}. Total payout: $${totalPayout.toFixed(2)}`,
      });

      onConfirmed();
      onOpenChange(false);
    } catch (error) {
      console.error('Error confirming payroll:', error);
      toast({
        title: "Error",
        description: "Failed to confirm payroll",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Payroll - {chatterName}</DialogTitle>
          <DialogDescription>
            Confirm the hours worked and commission rate for the week of {format(weekStart, 'MMM dd, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Sales:</span>
              <p>${totalSales.toFixed(2)}</p>
            </div>
            <div>
              <span className="font-medium">Hourly Rate:</span>
              <p>${currentHourlyRate.toFixed(2)}/hr</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours">Hours Worked</Label>
            <div className="space-y-1">
              <Input
                id="hours"
                type="number"
                min="0"
                step="0.5"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(parseFloat(e.target.value) || 0)}
                disabled={isLoadingAttendance}
              />
              <p className="text-xs text-muted-foreground">
                {isLoadingAttendance 
                  ? "Calculating from attendance..." 
                  : "Auto-calculated from attendance (8 hours per day worked). You can adjust if needed."
                }
              </p>
            </div>
           </div>

           <div className="space-y-2">
             <Label htmlFor="overtimePay">Overtime Pay ($)</Label>
             <Input
               id="overtimePay"
               type="number"
               min="0"
               step="0.01"
               value={overtimePay === 0 ? '' : overtimePay}
               onChange={(e) => setOvertimePay(parseFloat(e.target.value) || 0)}
               placeholder="0.00"
             />
           </div>

           <div className="space-y-2">
             <Label htmlFor="overtimeNotes">Overtime Pay Notes</Label>
             <Textarea
               id="overtimeNotes"
               value={overtimeNotes}
               onChange={(e) => setOvertimeNotes(e.target.value)}
               placeholder="Enter reason for overtime pay (if any)..."
               className="min-h-[60px]"
             />
           </div>

          <div className="space-y-2">
            <Label htmlFor="commission">Commission Rate (%)</Label>
            <Select value={commissionRate.toString()} onValueChange={(value) => setCommissionRate(parseFloat(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0% (Below $1000)</SelectItem>
                <SelectItem value="1">1% ($1000-$1499)</SelectItem>
                <SelectItem value="2">2% ($1500-$1999)</SelectItem>
                <SelectItem value="3">3% ($2000+)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deduction">Deduction Amount ($)</Label>
            <Input
              id="deduction"
              type="number"
              min="0"
              step="0.01"
              value={deductionAmount === 0 ? '' : deductionAmount}
              onChange={(e) => setDeductionAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deductionNotes">Deduction Notes (Reason)</Label>
            <Textarea
              id="deductionNotes"
              value={deductionNotes}
              onChange={(e) => setDeductionNotes(e.target.value)}
              placeholder="Enter reason for deduction (if any)..."
              className="min-h-[80px]"
            />
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Hours Pay ({hoursWorked}h × ${currentHourlyRate}/h):</span>
              <span>${hourlyPay.toFixed(2)}</span>
            </div>
           <div className="flex justify-between text-sm">
             <span>Commission ({commissionRate}% × ${totalSales.toFixed(2)}):</span>
             <span>${commissionAmount.toFixed(2)}</span>
           </div>
           {overtimePay > 0 && (
             <div className="flex justify-between text-sm text-green-600">
               <span>Overtime Pay:</span>
               <span>+${overtimePay.toFixed(2)}</span>
             </div>
           )}
            {deductionAmount > 0 && (
              <div className="flex justify-between text-sm text-destructive">
                <span>Deduction:</span>
                <span>-${deductionAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Total Payout:</span>
              <span>${totalPayout.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmPayroll} 
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Processing...' : 'Pay Chatter'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};