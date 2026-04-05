import React from 'react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Employee } from "@/types/employee";

interface EmployeeActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  employee?: Employee;
  action: 'archive' | 'delete';
}

const EmployeeActionsDialog: React.FC<EmployeeActionsDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  employee,
  action
}) => {
  const actionText = action === 'archive' ? 'Archive' : 'Delete';
  const actionDescription = action === 'archive' 
    ? 'This will archive the user and hide them from all active views across the system. Their data will be preserved and they can be restored later.'
    : 'This will permanently deactivate the user\'s authentication and remove all their access. This action cannot be undone.';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{actionText} Employee</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to {action} {employee?.name}? {actionDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={action === 'delete' ? "bg-destructive text-destructive-foreground" : "bg-amber-500 text-foreground"}
          >
            {actionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EmployeeActionsDialog;