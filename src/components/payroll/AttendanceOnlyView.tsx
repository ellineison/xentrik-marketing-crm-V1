import React, { useState, useEffect } from 'react';
import { AttendanceTable } from './AttendanceTable';
import { WeekNavigator } from './WeekNavigator';
import { AttendanceExportButton } from './AttendanceExportButton';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getWeekStart } from '@/utils/weekCalculations';

export const AttendanceOnlyView: React.FC = () => {
  const { user, userRole, userRoles } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [userDepartment, setUserDepartment] = useState<string | null>(null);
  
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

  const weekStart = getWeekStart(selectedWeek, userDepartment, userRole, userRoles);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Attendance Tracker</h2>
          <p className="text-sm text-muted-foreground">
            {userDepartment === '10PM' ? '(Wednesday to Tuesday)' : '(Thursday to Wednesday)'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <AttendanceExportButton 
            selectedChatterId={user?.id}
            selectedWeek={selectedWeek}
          />
          <WeekNavigator selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} />
        </div>
      </div>

      <AttendanceTable 
        chatterId={user?.id} 
        selectedWeek={selectedWeek}
        isSalesLocked={false}
        key={refreshKey}
      />
    </div>
  );
};
