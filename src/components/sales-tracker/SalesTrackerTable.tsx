import React, { useState, useEffect } from 'react';
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
}

interface SalesModel {
  model_name: string;
}

interface SalesTrackerTableProps {
  chatterId?: string;
  selectedWeek?: Date;
}

const DAYS_OF_WEEK = [
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
];

export const SalesTrackerTable: React.FC<SalesTrackerTableProps> = ({
  chatterId,
  selectedWeek = new Date()
}) => {
  const { user, userRole, userRoles } = useAuth();
  const { toast } = useToast();
  const [salesData, setSalesData] = useState<SalesEntry[]>([]);
  const [models, setModels] = useState<SalesModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [editingHourlyRate, setEditingHourlyRate] = useState(false);
  const [tempHourlyRate, setTempHourlyRate] = useState<number>(0);
  const [chatterName, setChatterName] = useState<string>('');

  const effectiveChatterId = chatterId || user?.id;
  const isAdmin = userRole === 'Admin' || userRoles?.includes('Admin');
  const canApprovePayroll = userRole === 'HR / Work Force' || userRoles?.includes('HR / Work Force');
  const isChatter = userRole === 'Chatter' || userRoles?.includes('Chatter');
  const canEdit = isAdmin || effectiveChatterId === user?.id;

  // Calculate week start (Thursday) - Fixed logic
  const getWeekStart = (date: Date) => {
    const day = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const thursday = new Date(date);
    thursday.setHours(0, 0, 0, 0); // Reset time to start of day
    
    if (day === 0) { // Sunday - go back 3 days to Thursday
      thursday.setDate(date.getDate() - 3);
    } else if (day === 1) { // Monday - go back 4 days to Thursday  
      thursday.setDate(date.getDate() - 4);
    } else if (day === 2) { // Tuesday - go back 5 days to Thursday
      thursday.setDate(date.getDate() - 5);
    } else if (day === 3) { // Wednesday - go back 6 days to Thursday
      thursday.setDate(date.getDate() - 6);
    } else if (day === 4) { // Thursday - same day
      thursday.setDate(date.getDate());
    } else if (day === 5) { // Friday - go back 1 day to Thursday
      thursday.setDate(date.getDate() - 1);
    } else if (day === 6) { // Saturday - go back 2 days to Thursday
      thursday.setDate(date.getDate() - 2);
    }
    
    return thursday;
  };

  const weekStart = getWeekStart(selectedWeek);
  const currentWeekStart = getWeekStart(new Date());
  const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();
  const isFutureWeek = weekStart.getTime() > currentWeekStart.getTime();
  
  // Week is editable if it's current week or future, and user has edit permissions
  const isWeekEditable = canEdit && (isCurrentWeek || isFutureWeek);

  console.log('Week calculation debug:', {
    today: new Date().toISOString().split('T')[0],
    todayDay: new Date().getDay(),
    selectedWeek: selectedWeek.toISOString().split('T')[0],
    weekStart: weekStart.toISOString().split('T')[0],
    currentWeekStart: currentWeekStart.toISOString().split('T')[0],
    isCurrentWeek,
    isFutureWeek,
    isWeekEditable,
    canEdit,
    isAdmin,
    effectiveChatterId,
    userId: user?.id
  });

  useEffect(() => {
    if (effectiveChatterId) {
      fetchData();
    }
  }, [effectiveChatterId, selectedWeek]);

  // Get sales locking status (moved up to fix variable order)
  const isSalesLocked = salesData.length > 0 && salesData[0]?.sales_locked;
  const isAdminConfirmed = salesData.length > 0 && salesData[0]?.admin_confirmed;
  const confirmedHours = salesData.length > 0 ? salesData[0]?.confirmed_hours_worked || 0 : 0;
  const confirmedCommissionRate = salesData.length > 0 ? salesData[0]?.confirmed_commission_rate || 0 : 0;
  const overtimePay = salesData.length > 0 ? salesData[0]?.overtime_pay || 0 : 0;
  const overtimeNotes = salesData.length > 0 ? salesData[0]?.overtime_notes || '' : '';
  const deductionAmount = salesData.length > 0 ? salesData[0]?.deduction_amount || 0 : 0;
  const deductionNotes = salesData.length > 0 ? salesData[0]?.deduction_notes || '' : '';

  // Check if inputs should be disabled (locked sales or not editable week)
  const areInputsDisabled = !isWeekEditable || isSalesLocked;

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
      isWeekEditable,
      areInputsDisabled,
      hasChatterRole: userRole === 'Chatter' || userRoles?.includes('Chatter'),
      effectiveChatterMatches: effectiveChatterId === user?.id
    });
  }, [isAdmin, isCurrentWeek, isSalesLocked, userRole, userRoles, effectiveChatterId, user?.id, salesData, models, canEdit, isWeekEditable, areInputsDisabled]);

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

      // Fetch chatter's hourly rate and name
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('hourly_rate, name')
        .eq('id', effectiveChatterId)
        .single();

      if (profileError) throw profileError;

      const uniqueModels = Array.from(
        new Set(modelsData?.map(m => m.model_name) || [])
      ).map(name => ({ model_name: name }));

      setSalesData(salesData || []);
      setModels(uniqueModels);
      setHourlyRate(profileData?.hourly_rate || 0);
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
    if (!effectiveChatterId || !isWeekEditable) return;

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

  const updateHourlyRate = async (newRate: number) => {
    if (!effectiveChatterId || !isAdmin) {
      console.log('Hourly rate update blocked:', { effectiveChatterId, isAdmin, userRole });
      return;
    }

    console.log('Attempting to update hourly rate:', { 
      effectiveChatterId, 
      newRate, 
      isAdmin, 
      userRole,
      currentRate: hourlyRate 
    });

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ hourly_rate: newRate })
        .eq('id', effectiveChatterId)
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      console.log('Hourly rate update successful:', data);

      setHourlyRate(newRate);
      toast({
        title: "Success",
        description: "Hourly rate updated successfully",
      });
    } catch (error) {
      console.error('Error updating hourly rate:', error);
      toast({
        title: "Error",
        description: "Failed to update hourly rate",
        variant: "destructive",
      });
    }
  };

  const startEditingHourlyRate = () => {
    setTempHourlyRate(hourlyRate);
    setEditingHourlyRate(true);
  };

  const saveHourlyRate = async () => {
    await updateHourlyRate(tempHourlyRate);
    setEditingHourlyRate(false);
  };

  const cancelEditingHourlyRate = () => {
    setTempHourlyRate(hourlyRate);
    setEditingHourlyRate(false);
  };

  const confirmWeekSales = async () => {
    if (!effectiveChatterId || !isCurrentWeek) return;

    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('sales_tracker')
        .update({ sales_locked: true })
        .eq('chatter_id', effectiveChatterId)
        .eq('week_start_date', weekStartStr);

      if (error) throw error;

      await fetchData(); // Refresh data
      toast({
        title: "Sales Confirmed",
        description: "Your weekly sales have been locked and submitted for review.",
      });
    } catch (error) {
      console.error('Error confirming sales:', error);
      toast({
        title: "Error",
        description: "Failed to confirm sales",
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

      await fetchData(); // Refresh data
      toast({
        title: "Payroll Rejected",
        description: "Sales have been unlocked for the chatter to review and resubmit.",
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
    const hourlyPay = confirmedHours * hourlyRate;
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
      hourlyRate,
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
      {isWeekEditable && !isSalesLocked && (
        <div className="flex justify-between items-center">
          <AddModelDropdown
            chatterId={effectiveChatterId}
            weekStart={weekStart}
            onModelAdded={fetchData}
            disabled={!isWeekEditable || isSalesLocked}
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
              {isAdmin && isWeekEditable && (
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
                {isAdmin && isWeekEditable && (
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
                {isAdmin && isWeekEditable && (
                  <TableCell></TableCell>
                )}
              </TableRow>
            )}
            {models.length > 0 && (
              <TableRow className="border-t-2 bg-muted/20">
                <TableCell className="font-bold">Hourly Rate</TableCell>
                <TableCell 
                  colSpan={DAYS_OF_WEEK.length} 
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-2">
                    {editingHourlyRate ? (
                      <>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={tempHourlyRate}
                          onChange={(e) => setTempHourlyRate(parseFloat(e.target.value) || 0)}
                          className="w-[120px] text-center"
                          placeholder="$0.00/hr"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={saveHourlyRate}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEditingHourlyRate}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="min-w-[120px] text-center">
                          ${hourlyRate.toFixed(2)}/hr
                        </span>
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={startEditingHourlyRate}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center font-bold">
                  ${hourlyRate.toFixed(2)}/hr
                </TableCell>
                {isAdmin && isWeekEditable && (
                  <TableCell></TableCell>
                )}
              </TableRow>
            )}
            {models.length === 0 && (
              <TableRow>
                <TableCell 
                  colSpan={DAYS_OF_WEEK.length + 2 + (isAdmin && isWeekEditable ? 1 : 0)} 
                  className="text-center text-muted-foreground py-8"
                >
                  No models added yet. Click "Add Model" to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Action Buttons */}
      {models.length > 0 && (
        <div className="flex gap-2 justify-end pt-4 border-t">
          {/* Debug logging for lock button visibility */}
          {(() => {
            const hasChatterRole = userRole === 'Chatter' || userRoles?.includes('Chatter');
            const isOwnData = effectiveChatterId === user?.id;
            const showLockButton = hasChatterRole && isOwnData && isCurrentWeek && !isSalesLocked;
            
            console.log('Lock button visibility check:', {
              hasChatterRole,
              userRole,
              userRoles,
              isOwnData,
              effectiveChatterId,
              userId: user?.id,
              isCurrentWeek,
              isSalesLocked,
              modelsLength: models.length,
              finalCondition: showLockButton && models.length > 0
            });
            
            return null;
          })()}
          
          {/* Lock Sales button - Chatters and Non-HR Admins can lock their own sales */}
          {(() => {
            const hasChatterRole = userRole === 'Chatter' || userRoles?.includes('Chatter');
            const hasAdminRole = userRole === 'Admin' || userRoles?.includes('Admin');
            const isHRWorkforce = userRole === 'HR / Work Force' || userRoles?.includes('HR / Work Force');
            
            // HR/Workforce users should not be able to lock sales, only approve/reject
            const canLockSales = hasChatterRole || (hasAdminRole && !isHRWorkforce);
            const isOwnData = effectiveChatterId === user?.id;
            const shouldShowLockButton = canLockSales && isOwnData && isCurrentWeek && !isSalesLocked;
            
            console.log('DETAILED Lock button check:', {
              hasChatterRole,
              hasAdminRole,
              isHRWorkforce,
              canLockSales,
              userRole,
              userRoles,
              isOwnData,
              effectiveChatterId,
              userId: user?.id,
              isCurrentWeek,
              isSalesLocked,
              shouldShowLockButton,
              'userRole === Chatter': userRole === 'Chatter',
              'userRoles?.includes(Chatter)': userRoles?.includes('Chatter'),
              'userRole === Admin': userRole === 'Admin',
              'userRoles?.includes(Admin)': userRoles?.includes('Admin'),
              'userRole === HR / Work Force': userRole === 'HR / Work Force',
              'userRoles?.includes(HR / Work Force)': userRoles?.includes('HR / Work Force'),
              'effectiveChatterId === user?.id': effectiveChatterId === user?.id
            });
            
            if (shouldShowLockButton) {
              return (
                <Button 
                  onClick={confirmWeekSales}
                  className="flex items-center gap-2"
                  variant="default"
                >
                  <Lock className="h-4 w-4" />
                  Lock Weekly Sales
                </Button>
              );
            }
            return null;
          })()}
          
          {/* Status messages for Chatters and Non-HR Admins */}
          {(() => {
            const hasChatterRole = userRole === 'Chatter' || userRoles?.includes('Chatter');
            const hasAdminRole = userRole === 'Admin' || userRoles?.includes('Admin');
            const isHRWorkforce = userRole === 'HR / Work Force' || userRoles?.includes('HR / Work Force');
            const canSeeStatus = hasChatterRole || (hasAdminRole && !isHRWorkforce);
            
            if (canSeeStatus && effectiveChatterId === user?.id && isSalesLocked && !isAdminConfirmed) {
              return (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  Sales locked - awaiting HR/Admin approval
                </div>
              );
            }
            return null;
          })()}
          
          {/* Payslip download for Chatters and Non-HR Admins */}
          {(() => {
            const hasChatterRole = userRole === 'Chatter' || userRoles?.includes('Chatter');
            const hasAdminRole = userRole === 'Admin' || userRoles?.includes('Admin');
            const isHRWorkforce = userRole === 'HR / Work Force' || userRoles?.includes('HR / Work Force');
            const canDownloadPayslip = hasChatterRole || (hasAdminRole && !isHRWorkforce);
            
            if (canDownloadPayslip && effectiveChatterId === user?.id && isAdminConfirmed) {
              return (
                <Button 
                  onClick={downloadPayslip}
                  className="flex items-center gap-2"
                  variant="default"
                >
                  <Download className="h-4 w-4" />
                  Download Payslip (PDF)
                </Button>
              );
            }
            return null;
          })()}

          {/* Admin and HR buttons */}
          {canApprovePayroll && isSalesLocked && !isAdminConfirmed && (
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowPayrollModal(true)}
                className="flex items-center gap-2"
                variant="default"
              >
                <CheckCircle className="h-4 w-4" />
                Approve Payroll
              </Button>
              <Button 
                onClick={rejectPayroll}
                className="flex items-center gap-2"
                variant="destructive"
              >
                <XCircle className="h-4 w-4" />
                Reject Payroll
              </Button>
            </div>
          )}
          
          {canApprovePayroll && isAdminConfirmed && (
            <div className="flex gap-2">
              <Button 
                onClick={downloadPayslip}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Download className="h-4 w-4" />
                Download Payslip (PDF)
              </Button>
              <Button 
                onClick={rejectPayroll}
                className="flex items-center gap-2"
                variant="destructive"
              >
                <XCircle className="h-4 w-4" />
                Reject Payroll
              </Button>
            </div>
          )}
        </div>
      )}

      <PayrollConfirmationModal
        open={showPayrollModal}
        onOpenChange={setShowPayrollModal}
        chatterName={chatterName}
        chatterId={effectiveChatterId || ''}
        weekStart={weekStart}
        totalSales={getWeekTotal()}
        currentHourlyRate={hourlyRate}
        onConfirmed={fetchData}
      />
    </div>
  );
};