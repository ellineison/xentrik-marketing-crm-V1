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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface PayrollConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatterName: string;
  chatterId: string;
  weekStart: Date;
  // legacy props retained for back-compat with LockSalesButton call site
  totalSales?: number;
  currentHourlyRate?: number;
  onConfirmed: () => void;
}

export const PayrollConfirmationModal: React.FC<PayrollConfirmationModalProps> = ({
  open,
  onOpenChange,
  chatterName,
  chatterId,
  weekStart,
  onConfirmed,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [snapshot, setSnapshot] = useState<{
    expected_salary: number;
    locked_total_sales: number;
    locked_hours_worked: number;
    locked_hourly_rate: number;
    locked_commission_rate: number;
    locked_hourly_pay: number;
    locked_commission_amount: number;
  } | null>(null);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);

  const [overtimePay, setOvertimePay] = useState<number>(0);
  const [overtimeNotes, setOvertimeNotes] = useState<string>('');
  const [bonusAmount, setBonusAmount] = useState<number>(0);
  const [bonusNotes, setBonusNotes] = useState<string>('');
  const [deductionAmount, setDeductionAmount] = useState<number>(0);
  const [deductionNotes, setDeductionNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!open || !chatterId) return;
    const loadSnapshot = async () => {
      setIsLoadingSnapshot(true);
      setSnapshotError(null);
      try {
        const weekStartStr = format(weekStart, 'yyyy-MM-dd');
        const { data, error } = await supabase
          .from('payroll_summaries')
          .select('*')
          .eq('chatter_id', chatterId)
          .eq('week_start_date', weekStartStr)
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          setSnapshotError(
            'No locked Expected Salary snapshot found. Ask the chatter to re-lock payroll.'
          );
          setSnapshot(null);
        } else {
          setSnapshot({
            expected_salary: Number(data.expected_salary) || 0,
            locked_total_sales: Number(data.locked_total_sales) || 0,
            locked_hours_worked: Number(data.locked_hours_worked) || 0,
            locked_hourly_rate: Number(data.locked_hourly_rate) || 0,
            locked_commission_rate: Number(data.locked_commission_rate) || 0,
            locked_hourly_pay: Number(data.locked_hourly_pay) || 0,
            locked_commission_amount: Number(data.locked_commission_amount) || 0,
          });
          setOvertimePay(Number(data.overtime_pay) || 0);
          setOvertimeNotes(data.overtime_notes || '');
          setBonusAmount(Number(data.bonus_amount) || 0);
          setBonusNotes(data.bonus_notes || '');
          setDeductionAmount(Number(data.deduction_amount) || 0);
          setDeductionNotes(data.deduction_notes || '');
        }
      } catch (e) {
        console.error(e);
        setSnapshotError('Failed to load payroll snapshot.');
      } finally {
        setIsLoadingSnapshot(false);
      }
    };
    loadSnapshot();
  }, [open, chatterId, weekStart]);

  const expectedSalary = snapshot?.expected_salary ?? 0;
  const approvedSalary = expectedSalary + overtimePay + bonusAmount - deductionAmount;

  const handleConfirmPayroll = async () => {
    if (!snapshot) return;
    setIsProcessing(true);
    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');

      // 1. Write approval to payroll_summaries (source of truth)
      const { error: summaryErr } = await supabase
        .from('payroll_summaries')
        .update({
          overtime_pay: overtimePay,
          overtime_notes: overtimeNotes || null,
          bonus_amount: bonusAmount,
          bonus_notes: bonusNotes || null,
          deduction_amount: deductionAmount,
          deduction_notes: deductionNotes || null,
          approved_salary: approvedSalary,
          approved_at: new Date().toISOString(),
          approved_by: user?.id || null,
        })
        .eq('chatter_id', chatterId)
        .eq('week_start_date', weekStartStr);
      if (summaryErr) throw summaryErr;

      // 2. Mirror onto sales_tracker for back-compat (existing UI gating + payslip)
      const { error: salesErr } = await supabase
        .from('sales_tracker')
        .update({
          admin_confirmed: true,
          confirmed_hours_worked: snapshot.locked_hours_worked,
          confirmed_commission_rate: snapshot.locked_commission_rate,
          overtime_pay: overtimePay + bonusAmount,
          overtime_notes:
            [overtimeNotes, bonusNotes].filter(Boolean).join(' | ') || null,
          deduction_amount: deductionAmount,
          deduction_notes: deductionNotes || null,
        })
        .eq('chatter_id', chatterId)
        .eq('week_start_date', weekStartStr);
      if (salesErr) throw salesErr;

      toast({
        title: 'Payroll Confirmed',
        description: `Approved Salary for ${chatterName}: $${approvedSalary.toFixed(2)}`,
      });
      onConfirmed();
      onOpenChange(false);
    } catch (error) {
      console.error('Error confirming payroll:', error);
      toast({
        title: 'Error',
        description: 'Failed to confirm payroll',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Approve Payroll — {chatterName}</DialogTitle>
          <DialogDescription>
            Week of {format(weekStart, 'MMM dd, yyyy')}. Snapshot values are
            read-only. Add overtime, bonus, or deductions to compute the
            Approved Salary.
          </DialogDescription>
        </DialogHeader>

        {isLoadingSnapshot ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : snapshotError ? (
          <div className="text-sm text-destructive py-4">{snapshotError}</div>
        ) : snapshot ? (
          <div className="space-y-4">
            {/* Read-only snapshot */}
            <div className="rounded-md border border-muted bg-secondary/10 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Sales</span>
                <span>${snapshot.locked_total_sales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hours Worked</span>
                <span>{snapshot.locked_hours_worked}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hourly Rate</span>
                <span>${snapshot.locked_hourly_rate.toFixed(2)}/hr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hourly Pay</span>
                <span>${snapshot.locked_hourly_pay.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Commission ({snapshot.locked_commission_rate}%)
                </span>
                <span>${snapshot.locked_commission_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-muted pt-2 mt-2 font-semibold text-green-600 dark:text-green-400">
                <span>Expected Salary</span>
                <span>${expectedSalary.toFixed(2)}</span>
              </div>
            </div>

            {/* Admin inputs */}
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
              <Textarea
                value={overtimeNotes}
                onChange={(e) => setOvertimeNotes(e.target.value)}
                placeholder="Overtime notes..."
                className="min-h-[50px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bonusAmount">Bonus ($)</Label>
              <Input
                id="bonusAmount"
                type="number"
                min="0"
                step="0.01"
                value={bonusAmount === 0 ? '' : bonusAmount}
                onChange={(e) => setBonusAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <Textarea
                value={bonusNotes}
                onChange={(e) => setBonusNotes(e.target.value)}
                placeholder="Bonus notes..."
                className="min-h-[50px]"
              />
              <p className="text-xs text-muted-foreground">
                Bonus is separate from overtime — use Bonus for performance
                rewards and Overtime for extra hours worked.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deduction">Deduction ($)</Label>
              <Input
                id="deduction"
                type="number"
                min="0"
                step="0.01"
                value={deductionAmount === 0 ? '' : deductionAmount}
                onChange={(e) => setDeductionAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <Textarea
                value={deductionNotes}
                onChange={(e) => setDeductionNotes(e.target.value)}
                placeholder="Deduction reason..."
                className="min-h-[60px]"
              />
            </div>

            {/* Approved Salary preview */}
            <div className="border-t pt-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Expected Salary</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  ${expectedSalary.toFixed(2)}
                </span>
              </div>
              {overtimePay > 0 && (
                <div className="flex justify-between">
                  <span>+ Overtime</span>
                  <span>+${overtimePay.toFixed(2)}</span>
                </div>
              )}
              {bonusAmount > 0 && (
                <div className="flex justify-between">
                  <span>+ Bonus</span>
                  <span>+${bonusAmount.toFixed(2)}</span>
                </div>
              )}
              {deductionAmount > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>− Deduction</span>
                  <span>-${deductionAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-2 text-blue-600 dark:text-blue-400">
                <span>Approved Salary</span>
                <span>${approvedSalary.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
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
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
