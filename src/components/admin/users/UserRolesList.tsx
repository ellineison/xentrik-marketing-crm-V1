
import React from "react";
import { Loader2 } from "lucide-react";
import UserRolesTable from "./UserRolesTable";
import EditUserRolesModal from "../EditUserRolesModal";
import EmployeeActionsDialog from "./EmployeeActionsDialog";
import useUserRoles from "./useUserRoles";
import useUserRolesUpdate from "./useUserRolesUpdate";

const UserRolesList: React.FC = () => {
  const {
    users,
    loading,
    selectedUser,
    setSelectedUser,
    isModalOpen,
    setIsModalOpen,
    isActionDialogOpen,
    setIsActionDialogOpen,
    pendingAction,
    fetchUsers,
    handleEdit,
    handleArchive,
    handleDelete,
    handleConfirmAction
  } = useUserRoles();

  const { handleUpdateUser } = useUserRolesUpdate(fetchUsers);

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-yellow" />
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <UserRolesTable 
          users={users} 
          onEditUser={handleEdit}
          onArchiveUser={handleArchive}
          onDeleteUser={handleDelete}
        />
      </div>
      
      <EditUserRolesModal 
        user={selectedUser}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onUpdate={handleUpdateUser}
      />
      
      <EmployeeActionsDialog 
        open={isActionDialogOpen}
        onOpenChange={setIsActionDialogOpen}
        onConfirm={handleConfirmAction}
        employee={selectedUser}
        action={pendingAction || 'archive'}
      />
    </>
  );
};

export default UserRolesList;
