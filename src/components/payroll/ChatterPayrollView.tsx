import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PayrollTable } from './PayrollTable';
import { AttendanceTable } from './AttendanceTable';
import { WeekNavigator } from './WeekNavigator';
import { GoogleSheetsLinkManager } from './GoogleSheetsLinkManager';
import { useSalesLockStatus } from './hooks/useSalesLockStatus';
import { useAuth } from '@/context/AuthContext';
import { LockSalesButton } from './LockSalesButton';
import { ApprovedPayrollStatus } from './ApprovedPayrollStatus';
import { AttendanceExportButton } from './AttendanceExportButton';
import { supabase } from '@/integrations/supabase/client';
import { getWeekStart } from '@/utils/weekCalculations';

export const ChatterPayrollView: React.FC = () => {
  const { user, userRole, userRoles } = useAuth();
  const [selectedWeek, setSelectedWeek] = React.useState(new Date());
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [userDepartment, setUserDepartment] = React.useState<string | null>(null);
  
  // Fetch user's department
  useEffect(() => {
    const fetchUserDepartment = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('profiles')
        .select('department')
        .eq('id', user.id)
        .single();
      setUserDepartment(data?.department || null);
    };
    fetchUserDepartment();
  }, [user?.id]);
  
  // Get sales lock status for the current user and week
  const { isSalesLocked, isAdminConfirmed } = useSalesLockStatus(user?.id, selectedWeek, refreshKey);

  const isAdmin = userRole === 'Admin' || userRoles?.includes('Admin');
  const canEdit = isAdmin || user?.id;

  // Calculate week start based on user's department
  const weekStart = getWeekStart(selectedWeek, userDepartment);
  const currentWeekStart = getWeekStart(new Date(), userDepartment);
  const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();

  const handleDataRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <>
      <div className="space-y-6">
          <Card className="bg-secondary/10 border-muted">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground flex items-center gap-2">
                Weekly Sales Tracker
                <span className="text-sm text-muted-foreground font-normal">
                  {userDepartment === '10PM' ? '(Wednesday to Tuesday)' : '(Thursday to Wednesday)'}
                </span>
              </CardTitle>
              <WeekNavigator selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} />
            </div>
            <GoogleSheetsLinkManager chatterId={user?.id} />
          </CardHeader>
          <CardContent>
            <PayrollTable chatterId={user?.id} selectedWeek={selectedWeek} key={refreshKey} />
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Attendance Tracker</h3>
          <AttendanceExportButton 
            selectedChatterId={user?.id}
            selectedWeek={selectedWeek}
          />
        </div>

        <AttendanceTable 
          chatterId={user?.id} 
          selectedWeek={selectedWeek}
          isSalesLocked={isSalesLocked}
          key={refreshKey}
        />

        <LockSalesButton
          chatterId={user?.id}
          selectedWeek={selectedWeek}
          isSalesLocked={isSalesLocked}
          isAdminConfirmed={isAdminConfirmed}
          isCurrentWeek={isCurrentWeek}
          canEdit={canEdit}
          onDataRefresh={handleDataRefresh}
        />
      </div>

      <ApprovedPayrollStatus
        chatterId={user?.id}
        selectedWeek={selectedWeek}
        isAdminConfirmed={isAdminConfirmed}
        show={isSalesLocked && isAdminConfirmed}
      />
    </>
  );
};