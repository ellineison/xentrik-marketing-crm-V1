import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Download } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generatePayslipPDF } from './PayslipGenerator';
import { buildPayslipData } from './hooks/usePayslipData';
import { getWeekStart } from '@/utils/weekCalculations';
import { useState, useEffect } from 'react';

interface ApprovedPayrollStatusProps {
  chatterId?: string;
  selectedWeek: Date;
  isAdminConfirmed: boolean;
  show: boolean;
}

export const ApprovedPayrollStatus: React.FC<ApprovedPayrollStatusProps> = ({
  chatterId,
  selectedWeek,
  isAdminConfirmed,
  show
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chatterDepartment, setChatterDepartment] = useState<string | null>(null);
  const [chatterRole, setChatterRole] = useState<string | null>(null);
  const [chatterRoles, setChatterRoles] = useState<string[] | null>(null);
  
  const effectiveChatterId = chatterId || user?.id;

  // Fetch chatter's department and role
  useEffect(() => {
    const fetchDepartmentAndRole = async () => {
      if (!effectiveChatterId) return;
      const { data } = await supabase
        .from('profiles')
        .select('department, role, roles')
        .eq('id', effectiveChatterId)
        .single();
      setChatterDepartment(data?.department || null);
      setChatterRole(data?.role || null);
      setChatterRoles(data?.roles || null);
    };
    fetchDepartmentAndRole();
  }, [effectiveChatterId]);

  // Calculate week start based on chatter's department and role
  const weekStart = getWeekStart(selectedWeek, chatterDepartment, chatterRole, chatterRoles);

  const downloadPayslip = async () => {
    if (!effectiveChatterId) return;

    try {
      const payslipData = await buildPayslipData(effectiveChatterId, weekStart);
      if (!payslipData) {
        toast({
          title: "Error",
          description: "No payroll data found for this week",
          variant: "destructive",
        });
        return;
      }
      generatePayslipPDF(payslipData);
      toast({
        title: "Payslip Downloaded",
        description: "Payslip has been generated and downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating payslip:', error);
      toast({
        title: "Error",
        description: "Failed to generate payslip",
        variant: "destructive",
      });
    }
  };

  if (!show || !isAdminConfirmed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-muted p-4 z-50">
      <div className="container mx-auto">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-blue-600">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Approved by HR</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadPayslip}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Payslip
          </Button>
        </div>
      </div>
    </div>
  );
};