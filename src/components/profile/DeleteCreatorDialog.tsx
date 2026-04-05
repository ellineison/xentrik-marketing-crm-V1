
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface DeleteCreatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorName: string;
  onConfirmDelete: () => Promise<boolean>;
  isDeleting: boolean;
}

const DeleteCreatorDialog: React.FC<DeleteCreatorDialogProps> = ({
  open,
  onOpenChange,
  creatorName,
  onConfirmDelete,
  isDeleting,
}) => {
  const navigate = useNavigate();

  const handleDelete = async () => {
    const success = await onConfirmDelete();
    if (success) {
      navigate("/creators");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive this creator?</AlertDialogTitle>
          <AlertDialogDescription>
            This will archive the creator profile for <strong>{creatorName}</strong>. 
            The creator will be hidden from active lists but can be restored later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Archiving...
              </>
            ) : (
              "Archive"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteCreatorDialog;
