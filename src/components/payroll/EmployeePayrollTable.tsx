import React from "react";
import { Card, CardContent } from '@/components/ui/card';
import { AttendanceExportButton } from './AttendanceExportButton';

interface Chatter {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
}

interface EmployeePayrollTableProps {
  users: Chatter[];
  onSelectChatter: (chatterId: string) => void;
  selectedWeek: Date;
}

const EmployeePayrollTable: React.FC<EmployeePayrollTableProps> = ({ 
  users,
  onSelectChatter,
  selectedWeek
}) => {
  // Group employees by department and sort alphabetically
  const shift6AM = users.filter(user => user.department === '6AM').sort((a, b) => a.name.localeCompare(b.name));
  const shift2PM = users.filter(user => user.department === '2PM').sort((a, b) => a.name.localeCompare(b.name));
  const shift10PM = users.filter(user => user.department === '10PM').sort((a, b) => a.name.localeCompare(b.name));
  const socialMediaTeam = users.filter(user => user.department === 'Social Media Team').sort((a, b) => a.name.localeCompare(b.name));
  const saChatterTeam = users.filter(user => user.department === 'S.A. Chatter').sort((a, b) => a.name.localeCompare(b.name));
  const noShift = users.filter(user => !user.department || !['6AM', '2PM', '10PM', 'Social Media Team', 'S.A. Chatter'].includes(user.department)).sort((a, b) => a.name.localeCompare(b.name));

  const renderUserGroup = (title: string, groupUsers: Chatter[], shiftType?: '6AM' | '2PM' | '10PM' | 'social-media' | 'sa-chatter' | 'none', teamName?: string) => {
    if (groupUsers.length === 0) return null;
    
    const getBadgeColor = () => {
      if (!shiftType) return 'bg-gray-500/10 text-gray-600';
      switch (shiftType) {
        case '6AM': return 'bg-blue-500/10 text-blue-600';
        case '2PM': return 'bg-pink-500/10 text-pink-600';
        case '10PM': return 'bg-orange-500/10 text-orange-600';
        case 'social-media': return 'bg-cyan-500/10 text-cyan-600';
        case 'sa-chatter': return 'bg-purple-500/10 text-purple-600';
        case 'none': return 'bg-gray-500/10 text-gray-600';
        default: return 'bg-gray-500/10 text-gray-600';
      }
    };

    const shouldShowEmployeeBadge = shiftType === 'none';
    
    return (
      <div className="mb-6">
        <div className="relative mb-3">
          <h4 className="text-md font-medium text-muted-foreground text-center">{title} ({groupUsers.length})</h4>
          {teamName && (
            <div className="absolute right-0 top-0">
              <AttendanceExportButton 
                selectedWeek={selectedWeek}
                selectedTeam={teamName}
              />
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupUsers.map((user) => (
            <Card 
              key={user.id} 
              className="bg-secondary/10 border-muted hover:border-primary/50 cursor-pointer transition-colors"
              onClick={() => window.open(`/payroll/${user.id}`, '_blank')}
            >
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-1">{user.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                <div className="flex gap-2 justify-center">
                  {shouldShowEmployeeBadge ? (
                    <span className={`text-xs ${getBadgeColor()} px-2 py-1 rounded`}>
                      {user.role}
                    </span>
                  ) : (
                    <span className={`text-xs ${getBadgeColor()} px-2 py-1 rounded`}>
                      {user.department}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-center">Employee Users ({users.length})</h3>
      {users.length > 0 ? (
        <div className="space-y-6">
          {renderUserGroup('6AM Shift', shift6AM, '6AM', '6AM')}
          {renderUserGroup('2PM Shift', shift2PM, '2PM', '2PM')}
          {renderUserGroup('10PM Shift', shift10PM, '10PM', '10PM')}
          {renderUserGroup('Social Media Team', socialMediaTeam, 'social-media', 'Social Media Team')}
          {renderUserGroup('S.A. Chatter', saChatterTeam, 'sa-chatter', 'S.A. Chatter')}
          {renderUserGroup('No Shift Assigned', noShift, 'none')}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No employee users found
        </div>
      )}
    </div>
  );
};

export default EmployeePayrollTable;