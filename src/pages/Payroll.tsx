import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AdminPayrollView } from '@/components/payroll/AdminPayrollView';
import { ChatterPayrollView } from '@/components/payroll/ChatterPayrollView';
import { AttendanceOnlyView } from '@/components/payroll/AttendanceOnlyView';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

const Payroll: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { userRole, userRoles, isAuthenticated, user } = useAuth();
  const [selectedChatterId, setSelectedChatterId] = useState<string | null>(null);

  // Handle URL parameter for chatter ID
  useEffect(() => {
    if (id) {
      setSelectedChatterId(id);
    }
  }, [id]);

  // Everyone except Creators can access Payroll
  const isCreator = userRole === 'Creator' || userRoles?.includes('Creator');
  const hasAccess = isAuthenticated && !isCreator;

  const isAdmin = userRole === 'Admin' || (userRoles && userRoles.includes('Admin'));
  const isVA = userRole === 'VA' || (userRoles && userRoles.includes('VA'));
  const isChatter = userRole === 'Chatter' || (userRoles && userRoles.includes('Chatter'));
  const isHR = userRole === 'HR / Work Force' || (userRoles && userRoles.includes('HR / Work Force'));
  const isSocialMedia = userRole === 'Marketing Team' || (userRoles && userRoles.includes('Marketing Team'));

  // Debug logging
  console.log('Payroll Access Debug:', { 
    userRole, 
    userRoles, 
    isVA, 
    isAdmin, 
    isHR,
    hasAccess,
    isAuthenticated 
  });
  
  // Roles that need sales tracker + attendance
  const needsSalesTracker = isChatter || isSocialMedia;
  
  // Roles that can manage all (Admin view)
  const canManageAll = isAdmin || isVA || isHR;

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-premium-dark flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access the Payroll.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-premium-dark">
      <div className="container mx-auto p-4">
        {canManageAll ? (
          <AdminPayrollView 
            selectedChatterId={selectedChatterId}
            onSelectChatter={setSelectedChatterId}
          />
        ) : needsSalesTracker ? (
          <ChatterPayrollView />
        ) : (
          <AttendanceOnlyView />
        )}
      </div>
    </div>
  );
};

export default Payroll;