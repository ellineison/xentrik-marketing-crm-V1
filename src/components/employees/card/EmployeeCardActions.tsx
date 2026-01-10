
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Edit, UserX, PauseCircle, PlayCircle } from "lucide-react";
import { Employee } from "@/types/employee";

interface EmployeeCardActionsProps {
  employee: Employee;
  onTogglePause: () => void;
  canChangeStatus: boolean;
  onDeactivateClick?: () => void;
}

const EmployeeCardActions: React.FC<EmployeeCardActionsProps> = ({ 
  employee, 
  onTogglePause, 
  canChangeStatus,
  onDeactivateClick
}) => {
  return (
    <div className="grid grid-cols-1 w-full">
      <Link to={`/team/${employee.id}`} state={{ returnToTeam: true }} className="w-full">
        <Button 
          variant="ghost" 
          className="rounded-none h-14 flex items-center justify-center text-sm hover:bg-muted w-full"
        >
          <Edit className="h-5 w-5 mr-2" />
          Edit
        </Button>
      </Link>
      
      {canChangeStatus && (
        <div className="grid grid-cols-2 w-full">
          {onDeactivateClick && (
            <Button 
              variant="ghost" 
              className="rounded-none h-14 flex items-center justify-center text-sm hover:bg-muted border-t border-border text-red-400 hover:text-red-300"
              onClick={onDeactivateClick}
            >
              <UserX className="h-5 w-5 mr-2" />
              Deactivate
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            className="rounded-none h-14 flex items-center justify-center text-sm hover:bg-muted border-t border-l border-border"
            onClick={onTogglePause}
          >
            {employee.status === "Paused" ? (
              <>
                <PlayCircle className="h-5 w-5 mr-2" />
                Resume
              </>
            ) : (
              <>
                <PauseCircle className="h-5 w-5 mr-2" />
                Pause
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmployeeCardActions;
