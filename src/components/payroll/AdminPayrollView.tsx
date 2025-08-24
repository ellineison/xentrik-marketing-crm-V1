import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Users } from 'lucide-react';
import { PayrollTable } from './PayrollTable';
import { AttendanceTable } from './AttendanceTable';
import { WeekNavigator } from './WeekNavigator';
import { GoogleSheetsLinkManager } from './GoogleSheetsLinkManager';
import { useSalesLockStatus } from './hooks/useSalesLockStatus';
import AdminPayrollTable from './AdminPayrollTable';
import ManagerPayrollTable from './ManagerPayrollTable';
import EmployeePayrollTable from './EmployeePayrollTable';
import { supabase } from '@/integrations/supabase/client';

interface Chatter {
  id: string;
  name: string;
  email: string;
  role: string;
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
  
  // Get sales lock status for the selected chatter and week
  const { isSalesLocked } = useSalesLockStatus(selectedChatterId, selectedWeek);

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
        .select('id, name, email, role, roles')
        .neq('role', 'Creator')
        .not('roles', 'cs', '{Creator}');

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
                Weekly Payroll
                <span className="text-sm text-muted-foreground font-normal">
                  (Thursday to Wednesday)
                </span>
              </CardTitle>
              <WeekNavigator selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} />
            </div>
            <GoogleSheetsLinkManager chatterId={selectedChatterId} isAdminView />
          </CardHeader>
          <CardContent>
            <PayrollTable chatterId={selectedChatterId} selectedWeek={selectedWeek} />
          </CardContent>
        </Card>

        <AttendanceTable 
          chatterId={selectedChatterId} 
          selectedWeek={selectedWeek}
          isSalesLocked={isSalesLocked}
        />
      </div>
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
          <AdminPayrollTable users={adminUsers} onSelectChatter={onSelectChatter} />
          <ManagerPayrollTable users={managerUsers} onSelectChatter={onSelectChatter} />
          <EmployeePayrollTable users={employeeUsers} onSelectChatter={onSelectChatter} />
        </div>
      )}
    </div>
  );
};