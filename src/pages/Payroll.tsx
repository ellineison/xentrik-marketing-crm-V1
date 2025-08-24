import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AdminPayrollView } from '@/components/payroll/AdminPayrollView';
import { ChatterPayrollView } from '@/components/payroll/ChatterPayrollView';
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

  // Check if user has access to Payroll
  const hasAccess = isAuthenticated && (
    userRole === 'Admin' || 
    userRoles?.includes('Admin') ||
    userRole === 'VA' || 
    userRoles?.includes('VA') ||
    userRole === 'Chatter' || 
    userRoles?.includes('Chatter') ||
    userRole === 'HR / Work Force' || 
    userRoles?.includes('HR / Work Force')
  );

  const isAdmin = userRole === 'Admin' || userRoles?.includes('Admin');
  const isVA = userRole === 'VA' || userRoles?.includes('VA');
  const isChatter = userRole === 'Chatter' || userRoles?.includes('Chatter');
  const isHR = userRole === 'HR / Work Force' || userRoles?.includes('HR / Work Force');

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
        {(isAdmin || isVA || isHR) ? (
          <AdminPayrollView 
            selectedChatterId={selectedChatterId}
            onSelectChatter={setSelectedChatterId}
          />
        ) : (
          <ChatterPayrollView />
        )}
      </div>
    </div>
  );
};

export default Payroll;