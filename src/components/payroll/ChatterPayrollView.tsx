import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PayrollTable } from './PayrollTable';
import { AttendanceTable } from './AttendanceTable';
import { WeekNavigator } from './WeekNavigator';
import { GoogleSheetsLinkManager } from './GoogleSheetsLinkManager';
import { useSalesLockStatus } from './hooks/useSalesLockStatus';
import { useAuth } from '@/context/AuthContext';
import { LockSalesButton } from './LockSalesButton';

export const ChatterPayrollView: React.FC = () => {
  const { user, userRole, userRoles } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Get sales lock status for the current user and week
  const { isSalesLocked } = useSalesLockStatus(user?.id, selectedWeek);

  const isAdmin = userRole === 'Admin' || userRoles?.includes('Admin');
  const canEdit = isAdmin || user?.id;

  // Calculate week start and current week status
  const getWeekStart = (date: Date) => {
    const day = date.getDay();
    const thursday = new Date(date);
    thursday.setHours(0, 0, 0, 0);
    
    if (day === 0) thursday.setDate(date.getDate() - 3);
    else if (day === 1) thursday.setDate(date.getDate() - 4);
    else if (day === 2) thursday.setDate(date.getDate() - 5);
    else if (day === 3) thursday.setDate(date.getDate() - 6);
    else if (day === 4) thursday.setDate(date.getDate());
    else if (day === 5) thursday.setDate(date.getDate() - 1);
    else if (day === 6) thursday.setDate(date.getDate() - 2);
    
    return thursday;
  };

  const weekStart = getWeekStart(selectedWeek);
  const currentWeekStart = getWeekStart(new Date());
  const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();

  const handleDataRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
        <Card className="bg-secondary/10 border-muted">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              Weekly Sales Tracker
              <span className="text-sm text-muted-foreground font-normal">
                (Thursday to Wednesday)
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
        isCurrentWeek={isCurrentWeek}
        canEdit={canEdit}
        onDataRefresh={handleDataRefresh}
      />
    </div>
  );
};