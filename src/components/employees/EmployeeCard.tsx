
import React from "react";
import { 
  Card,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Employee, EmployeeStatus } from "../../types/employee";

// Import the new component files
import EmployeeCardHeader from "./card/EmployeeCardHeader";
import EmployeeCardProfile from "./card/EmployeeCardProfile";
import EmployeeCardInfo from "./card/EmployeeCardInfo";
import EmployeeCardActions from "./card/EmployeeCardActions";

interface EmployeeCardProps {
  employee: Employee;
  onUpdate: (id: string, updates: Partial<Employee>) => void;
  isAdmin: boolean;
  currentUserId?: string;
  onDeactivateClick?: (employee: Employee) => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ 
  employee, 
  onUpdate,
  isAdmin,
  currentUserId,
  onDeactivateClick
}) => {
  const handleTogglePause = () => {
    const newStatus: EmployeeStatus = employee.status === "Paused" ? "Active" : "Paused";
    onUpdate(employee.id, { status: newStatus });
  };
  
  const isCurrentUser = currentUserId === employee.id;
  const canChangeStatus = isAdmin && !isCurrentUser;
  
  return (
    <Card className="overflow-hidden flex flex-col h-full rounded-lg border border-border bg-card hover:bg-muted/50 shadow-md">
      <div className="p-6 flex-grow space-y-6">
        {/* Header with email and role */}
        <EmployeeCardHeader employee={employee} />

        {/* Profile Image and Name */}
        <EmployeeCardProfile employee={employee} isCurrentUser={isCurrentUser} />
        
        {/* Info sections */}
        <EmployeeCardInfo employee={employee} />
      </div>
      
      <CardFooter className="mt-auto border-t border-border p-0">
        <EmployeeCardActions 
          employee={employee}
          onTogglePause={handleTogglePause}
          canChangeStatus={canChangeStatus}
          onDeactivateClick={onDeactivateClick ? () => onDeactivateClick(employee) : undefined}
        />
      </CardFooter>
    </Card>
  );
};

export default EmployeeCard;
