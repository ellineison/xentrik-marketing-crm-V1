import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Lock, Download, CheckCircle, Edit3, Check, X, XCircle } from 'lucide-react';
import { AddModelDropdown } from './AddModelDropdown';
import { PayrollConfirmationModal } from './PayrollConfirmationModal';

import { generatePayslipPDF } from './PayslipGenerator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { format, addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { getWeekStart as getWeekStartUtil, getDaysOfWeek } from '@/utils/weekCalculations';

interface SalesEntry {
  id: string;
  model_name: string;
  day_of_week: number;
  earnings: number;
  working_day?: boolean;
  sales_locked?: boolean;
  admin_confirmed?: boolean;
  confirmed_hours_worked?: number;
  confirmed_commission_rate?: number;
  overtime_pay?: number;
  overtime_notes?: string;
  deduction_amount?: number;
  deduction_notes?: string;
  attendance?: boolean;
}

interface SalesModel {
  model_name: string;
}

interface PayrollTableProps {
  chatterId?: string;
  selectedWeek?: Date;
}

export const PayrollTable: React.FC<PayrollTableProps> = ({
  chatterId,
  selectedWeek = new Date()
}) => {
  const { user, userRole, userRoles } = useAuth();
  const { toast } = useToast();
  const [salesData, setSalesData] = useState<SalesEntry[]>([]);
  const [models, setModels] = useState<SalesModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [chatterName, setChatterName] = useState<string>('');
  const [chatterDepartment, setChatterDepartment] = useState<string | null | undefined>(undefined);

  const effectiveChatterId = chatterId || user?.id;
  const isAdmin = userRole === 'Admin' || userRoles?.includes('Admin');
  const canApprovePayroll = userRole === 'HR / Work Force' || userRoles?.includes('HR / Work Force');
  const isChatter = userRole === 'Chatter' || userRoles?.includes('Chatter');
  const canEdit = isAdmin || effectiveChatterId === user?.id;

  // Calculate week start based on department cutoff - memoized to recalculate when department changes
  const weekStart = useMemo(() => 
    getWeekStartUtil(selectedWeek, chatterDepartment),
    [selectedWeek, chatterDepartment]
  );
  
  const currentWeekStart = useMemo(() => 
    getWeekStartUtil(new Date(), chatterDepartment),
    [chatterDepartment]
  );
  
  const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();
  const isFutureWeek = weekStart.getTime() > currentWeekStart.getTime();

  // Get days of week order based on department
  const DAYS_OF_WEEK = getDaysOfWeek(chatterDepartment);

  console.log('Week calculation debug:', {
    today: new Date().toISOString().split('T')[0],
    todayDay: new Date().getDay(),
    selectedWeek: selectedWeek.toISOString().split('T')[0],
    chatterDepartment,
    weekStart: weekStart.toISOString().split('T')[0],
    currentWeekStart: currentWeekStart.toISOString().split('T')[0],
    isCurrentWeek,
    isFutureWeek,
    canEdit,
    isAdmin,
    effectiveChatterId,
    userId: user?.id
  });

  // Get sales locking status
  const isSalesLocked = salesData.length > 0 && salesData[0]?.sales_locked;
  const isAdminConfirmed = salesData.length > 0 && salesData[0]?.admin_confirmed;
  const confirmedHours = salesData.length > 0 ? salesData[0]?.confirmed_hours_worked || 0 : 0;
  const confirmedCommissionRate = salesData.length > 0 ? salesData[0]?.confirmed_commission_rate || 0 : 0;
  const overtimePay = salesData.length > 0 ? salesData[0]?.overtime_pay || 0 : 0;
  const overtimeNotes = salesData.length > 0 ? salesData[0]?.overtime_notes || '' : '';
  const deductionAmount = salesData.length > 0 ? salesData[0]?.deduction_amount || 0 : 0;
  const deductionNotes = salesData.length > 0 ? salesData[0]?.deduction_notes || '' : '';

  // Check if inputs should be disabled (only if locked or user doesn't have permission)
  const areInputsDisabled = !canEdit || isSalesLocked;

  // Fetch data when component mounts or dependencies change
  useEffect(() => {
    const fetchChatterDepartment = async () => {
      if (!effectiveChatterId) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('department')
        .eq('id', effectiveChatterId)
        .single();
      
      setChatterDepartment(data?.department || null);
    };
    
    fetchChatterDepartment();
  }, [effectiveChatterId]);

  useEffect(() => {
    if (chatterDepartment !== undefined) {
      fetchData();
    }
  }, [effectiveChatterId, weekStart, chatterDepartment]);

  // Debug logging for button visibility
  useEffect(() => {
    console.log('Button visibility debug:', {
      isAdmin,
      isCurrentWeek,
      isSalesLocked,
      userRole,
      userRoles,
      effectiveChatterId,
      userId: user?.id,
      salesDataLength: salesData.length,
      modelsLength: models.length,
      canEdit,
      areInputsDisabled,
      hasChatterRole: userRole === 'Chatter' || userRoles?.includes('Chatter'),
      effectiveChatterMatches: effectiveChatterId === user?.id
    });
  }, [isAdmin, isCurrentWeek, isSalesLocked, userRole, userRoles, effectiveChatterId, user?.id, salesData, models, canEdit, areInputsDisabled]);

  const fetchData = async () => {
    if (!effectiveChatterId) return;
    
    setIsLoading(true);
    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      
      // Fetch sales data for the week
      const { data: salesData, error: salesError } = await supabase
        .from('sales_tracker')
        .select('*')
        .eq('chatter_id', effectiveChatterId)
        .eq('week_start_date', weekStartStr);

      if (salesError) throw salesError;

      // Fetch unique models for this chatter
      const { data: modelsData, error: modelsError } = await supabase
        .from('sales_tracker')
        .select('model_name')
        .eq('chatter_id', effectiveChatterId)
        .eq('week_start_date', weekStartStr);

      if (modelsError) throw modelsError;

      // Fetch chatter's name (department already fetched)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', effectiveChatterId)
        .single();

      if (profileError) throw profileError;

      const uniqueModels = Array.from(
        new Set(modelsData?.map(m => m.model_name) || [])
      ).map(name => ({ model_name: name }));

      setSalesData(salesData || []);
      setModels(uniqueModels);
      setChatterName(profileData?.name || '');
    } catch (error) {
      console.error('Error fetching sales data:', error);
      toast({
        title: "Error",
        description: "Failed to load sales data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getEarnings = (modelName: string, dayOfWeek: number) => {
    const entry = salesData.find(
      s => s.model_name === modelName && s.day_of_week === dayOfWeek
    );
    return entry?.earnings || 0;
  };

  const updateEarnings = async (modelName: string, dayOfWeek: number, earnings: number) => {
    if (!effectiveChatterId || !canEdit || isSalesLocked) return;

    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('sales_tracker')
        .upsert({
          model_name: modelName,
          day_of_week: dayOfWeek,
          earnings,
          week_start_date: weekStartStr,
          chatter_id: effectiveChatterId,
          working_day: true
        }, {
          onConflict: 'chatter_id,model_name,day_of_week,week_start_date'
        });

      if (error) throw error;

      // Update local state
      setSalesData(prev => {
        const existing = prev.find(
          s => s.model_name === modelName && s.day_of_week === dayOfWeek
        );
        
        if (existing) {
          return prev.map(s =>
            s.model_name === modelName && s.day_of_week === dayOfWeek
              ? { ...s, earnings }
              : s
          );
        } else {
          return [...prev, {
            id: `temp-${Date.now()}`,
            model_name: modelName,
            day_of_week: dayOfWeek,
            earnings,
            working_day: true
          }];
        }
      });
    } catch (error) {
      console.error('Error updating earnings:', error);
      toast({
        title: "Error",
        description: "Failed to update earnings",
        variant: "destructive",
      });
    }
  };

  const removeModel = async (modelName: string) => {
    if (!effectiveChatterId || !isAdmin) return;

    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('sales_tracker')
        .delete()
        .eq('chatter_id', effectiveChatterId)
        .eq('model_name', modelName)
        .eq('week_start_date', weekStartStr);

      if (error) throw error;

      setModels(prev => prev.filter(m => m.model_name !== modelName));
      setSalesData(prev => prev.filter(s => s.model_name !== modelName));
      
      toast({
        title: "Success",
        description: "Model removed successfully",
      });
    } catch (error) {
      console.error('Error removing model:', error);
      toast({
        title: "Error",
        description: "Failed to remove model",
        variant: "destructive",
      });
    }
  };

  const getDayTotal = (dayOfWeek: number) => {
    return salesData
      .filter(s => s.day_of_week === dayOfWeek)
      .reduce((sum, s) => sum + s.earnings, 0);
  };

  const getModelTotal = (modelName: string) => {
    return salesData
      .filter(s => s.model_name === modelName)
      .reduce((sum, s) => sum + s.earnings, 0);
  };

  const getWeekTotal = () => {
    return salesData.reduce((sum, s) => sum + s.earnings, 0);
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

      fetchData(); // Refresh data
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

  const downloadPayslip = () => {
    if (!chatterName || !isAdminConfirmed) return;

    const weekEnd = addDays(weekStart, 6);
    const totalSales = getWeekTotal();
    const commissionAmount = (totalSales * confirmedCommissionRate) / 100;
    
    // Get hourly rate from the attendance table (we don't store it here anymore)
    const hourlyPay = confirmedHours * 0; // Will be calculated elsewhere
    const totalPayout = hourlyPay + commissionAmount + overtimePay - deductionAmount;

    const payslipData = {
      chatterName,
      weekStart,
      weekEnd,
      salesData: salesData.map(entry => ({
        model_name: entry.model_name,
        day_of_week: entry.day_of_week,
        earnings: entry.earnings,
      })),
      totalSales,
      hoursWorked: confirmedHours,
      hourlyRate: 0, // Will be fetched from profiles table
      commissionRate: confirmedCommissionRate,
      commissionAmount,
      overtimePay,
      overtimeNotes,
      deductionAmount,
      deductionNotes,
      totalPayout,
    };

    generatePayslipPDF(payslipData);
  };

  const handleInputBlur = async (modelName: string, dayOfWeek: number, inputValue: string) => {
    const numericValue = inputValue === '' ? 0 : parseFloat(inputValue) || 0;
    const currentValue = getEarnings(modelName, dayOfWeek);
    
    // Only update if value changed
    if (numericValue !== currentValue) {
      await updateEarnings(modelName, dayOfWeek, numericValue);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse"></div>
        <div className="h-32 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canEdit && !isSalesLocked && (
        <div className="flex justify-between items-center">
          <AddModelDropdown
            chatterId={effectiveChatterId}
            weekStart={weekStart}
            onModelAdded={fetchData}
            disabled={!canEdit || isSalesLocked}
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">Model</TableHead>
              {DAYS_OF_WEEK.map(day => (
                <TableHead key={day.value} className="text-center min-w-[80px]">
                  {day.label}
                </TableHead>
              ))}
              <TableHead className="text-center min-w-[80px]">Total</TableHead>
              {isAdmin && !isSalesLocked && (
                <TableHead className="w-[50px]"></TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((model) => (
              <TableRow key={model.model_name}>
                <TableCell className="font-medium">{model.model_name}</TableCell>
                {DAYS_OF_WEEK.map(day => (
                  <TableCell key={day.value} className="text-center">
                    <Input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*\.?[0-9]*"
                      defaultValue={(() => {
                        const earnings = getEarnings(model.model_name, day.value);
                        return earnings === 0 ? '' : earnings.toString();
                      })()}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          handleInputBlur(model.model_name, day.value, value);
                        } else {
                          // Reset invalid value
                          const earnings = getEarnings(model.model_name, day.value);
                          e.target.value = earnings === 0 ? '' : earnings.toString();
                        }
                      }}
                      className="w-full text-center"
                      disabled={areInputsDisabled}
                      placeholder="0.00"
                    />
                  </TableCell>
                ))}
                <TableCell className="text-center font-semibold">
                  ${getModelTotal(model.model_name).toFixed(2)}
                </TableCell>
                {isAdmin && !isSalesLocked && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeModel(model.model_name)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {models.length > 0 && (
              <TableRow className="border-t-2">
                <TableCell className="font-bold">Daily Total</TableCell>
                {DAYS_OF_WEEK.map(day => (
                  <TableCell key={day.value} className="text-center font-bold">
                    ${getDayTotal(day.value).toFixed(2)}
                  </TableCell>
                ))}
                <TableCell className="text-center font-bold text-primary">
                  ${getWeekTotal().toFixed(2)}
                </TableCell>
                {isAdmin && !isSalesLocked && (
                  <TableCell></TableCell>
                )}
              </TableRow>
            )}
            {models.length === 0 && (
              <TableRow>
                <TableCell 
                  colSpan={DAYS_OF_WEEK.length + 2 + (isAdmin && !isSalesLocked ? 1 : 0)} 
                  className="text-center text-muted-foreground py-8"
                >
                  No models added yet. Click "Add Model" to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Download payslip button for confirmed payroll */}
      
      {models.length > 0 && canApprovePayroll && isAdminConfirmed && (
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button 
            onClick={downloadPayslip}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Download className="h-4 w-4" />
            Download Payslip (PDF)
          </Button>
        </div>
      )}

      <PayrollConfirmationModal
        open={showPayrollModal}
        onOpenChange={setShowPayrollModal}
        chatterName={chatterName}
        chatterId={effectiveChatterId || ''}
        weekStart={weekStart}
        totalSales={getWeekTotal()}
        currentHourlyRate={0}
        onConfirmed={fetchData}
      />
    </div>
  );
};