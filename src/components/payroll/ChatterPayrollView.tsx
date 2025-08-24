import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PayrollTable } from './PayrollTable';
import { AttendanceTable } from './AttendanceTable';
import { WeekNavigator } from './WeekNavigator';
import { GoogleSheetsLinkManager } from './GoogleSheetsLinkManager';
import { useSalesLockStatus } from './hooks/useSalesLockStatus';
import { useAuth } from '@/context/AuthContext';

export const ChatterPayrollView: React.FC = () => {
  const { user } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  
  // Get sales lock status for the current user and week
  const { isSalesLocked } = useSalesLockStatus(user?.id, selectedWeek);

  return (
    <div className="space-y-6">
        <Card className="bg-secondary/10 border-muted">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              Weekly Payroll
              <span className="text-sm text-muted-foreground font-normal">
                (Thursday to Wednesday)
              </span>
            </CardTitle>
            <WeekNavigator selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} />
          </div>
          <GoogleSheetsLinkManager chatterId={user?.id} />
        </CardHeader>
        <CardContent>
          <PayrollTable chatterId={user?.id} selectedWeek={selectedWeek} />
        </CardContent>
      </Card>

      <AttendanceTable 
        chatterId={user?.id} 
        selectedWeek={selectedWeek}
        isSalesLocked={isSalesLocked}
      />
    </div>
  );
};