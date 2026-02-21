import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Users, DollarSign } from 'lucide-react';
import { PayrollTable } from './PayrollTable';
import { AttendanceTable } from './AttendanceTable';
import { WeekNavigator } from './WeekNavigator';
import { GoogleSheetsLinkManager } from './GoogleSheetsLinkManager';
import { useSalesLockStatus } from './hooks/useSalesLockStatus';
import { useExpectedSalary } from './hooks/useExpectedSalary';
import { LockSalesButton } from './LockSalesButton';
import { ApprovedPayrollStatus } from './ApprovedPayrollStatus';
import AdminPayrollTable from './AdminPayrollTable';
import ManagerPayrollTable from './ManagerPayrollTable';
import EmployeePayrollTable from './EmployeePayrollTable';
import { AttendanceExportButton } from './AttendanceExportButton';
import { supabase } from '@/integrations/supabase/client';
import { getWeekStart } from '@/utils/weekCalculations';

interface Chatter {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
}

interface AdminPayrollViewProps {
  selectedChatterId: string | null;
  onSelectChatter: (chatterId: string | null) => void;
}

export const AdminPayrollView: React.FC<AdminPayrollViewProps> = ({
  selectedChatterId,
  onSelectChatter,
}) => {
  const [chatters, setChatters] = useState<Chatter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Get sales lock status for the selected chatter and week
  const { isSalesLocked, isAdminConfirmed } = useSalesLockStatus(selectedChatterId, selectedWeek, refreshKey);
  const chatterDept = chatters.find(c => c.id === selectedChatterId)?.department || null;
  const { expectedSalary } = useExpectedSalary(
    selectedChatterId || undefined, selectedWeek, isSalesLocked, isAdminConfirmed, chatterDept
  );

  // Calculate week start and current week status
  // Note: For admin view showing all users, we use standard cutoff (department passed in components)
  const weekStart = getWeekStart(selectedWeek);
  const currentWeekStart = getWeekStart(new Date());
  const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();

  const handleDataRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Separate users by role
  const adminUsers = chatters.filter(user => user.role === 'Admin');
  const managerUsers = chatters.filter(user => user.role === 'Manager');
  const employeeUsers = chatters.filter(user => user.role === 'Employee');

  useEffect(() => {
    fetchChatters();
  }, []);

  const fetchChatters = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, roles, department, status')
        .neq('role', 'Creator')
        .not('roles', 'cs', '{Creator}')
        .eq('status', 'Active');

      if (error) throw error;

      // Filter out any users who have 'Creator' in their roles array
      const filteredData = (data || []).filter(user => 
        !user.roles?.includes('Creator')
      );

      setChatters(filteredData);
    } catch (error) {
      console.error('Error fetching chatters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedChatter = chatters.find(c => c.id === selectedChatterId);

  if (selectedChatterId && selectedChatter) {
    return (
      <>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => onSelectChatter(null)}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Chatters
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{selectedChatter.name}</h1>
              <p className="text-muted-foreground">{selectedChatter.email}</p>
            </div>
          </div>

          <Card className="bg-secondary/10 border-muted">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground flex items-center gap-2">
                  Weekly Sales Tracker
                  <span className="text-sm text-muted-foreground font-normal">
                    {selectedChatter?.department === '10PM' ? '(Wednesday to Tuesday)' : '(Thursday to Wednesday)'}
                  </span>
                </CardTitle>
                <div className="flex items-center gap-3">
                  <WeekNavigator selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} />
                  {isSalesLocked && expectedSalary !== null && (
                    <div className="flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-md border border-green-500/20">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm font-semibold">
                        Expected Salary: ${expectedSalary.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <GoogleSheetsLinkManager chatterId={selectedChatterId} isAdminView />
            </CardHeader>
            <CardContent>
              <PayrollTable chatterId={selectedChatterId} selectedWeek={selectedWeek} key={refreshKey} />
            </CardContent>
          </Card>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Attendance Tracker</h3>
            <AttendanceExportButton 
              selectedChatterId={selectedChatterId}
              selectedWeek={selectedWeek}
            />
          </div>

          <AttendanceTable 
            chatterId={selectedChatterId} 
            selectedWeek={selectedWeek}
            isSalesLocked={isSalesLocked}
            key={refreshKey}
          />

          <LockSalesButton
            chatterId={selectedChatterId}
            selectedWeek={selectedWeek}
            isSalesLocked={isSalesLocked}
            isAdminConfirmed={isAdminConfirmed}
            isCurrentWeek={isCurrentWeek}
            canEdit={true}
            onDataRefresh={handleDataRefresh}
          />
        </div>

        <ApprovedPayrollStatus
          chatterId={selectedChatterId}
          selectedWeek={selectedWeek}
          isAdminConfirmed={isAdminConfirmed}
          show={isSalesLocked && isAdminConfirmed}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Payroll - Select Chatter</h1>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="h-6 bg-muted rounded w-48"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(2)].map((_, j) => (
                  <Card key={j} className="bg-secondary/10 border-muted animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : chatters.length === 0 ? (
        <Card className="bg-secondary/10 border-muted">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <AdminPayrollTable users={adminUsers} onSelectChatter={onSelectChatter} selectedWeek={new Date()} />
          <ManagerPayrollTable users={managerUsers} onSelectChatter={onSelectChatter} selectedWeek={new Date()} />
          <EmployeePayrollTable users={employeeUsers} onSelectChatter={onSelectChatter} selectedWeek={new Date()} />
        </div>
      )}
    </div>
  );
};