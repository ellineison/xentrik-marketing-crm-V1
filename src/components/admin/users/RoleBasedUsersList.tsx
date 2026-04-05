import React from "react";
import { Loader2 } from "lucide-react";
import AdminUsersTable from "./AdminUsersTable";
import CreatorUsersTable from "./CreatorUsersTable";
import OtherRolesUsersTable from "./OtherRolesUsersTable";
import EditUserRolesModal from "../EditUserRolesModal";
import EmployeeActionsDialog from "./EmployeeActionsDialog";
import useUserRoles from "./useUserRoles";
import useUserRolesUpdate from "./useUserRolesUpdate";
import { Separator } from "@/components/ui/separator";

const RoleBasedUsersList: React.FC = () => {
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
      <div className="space-y-8">
        {/* Admin Users Table */}
        <div className="rounded-md border p-4">
          <AdminUsersTable 
            users={users} 
            onEditUser={handleEdit}
            onArchiveUser={handleArchive}
            onDeleteUser={handleDelete}
          />
        </div>

        <Separator />

        {/* Creator Users Table */}
        <div className="rounded-md border p-4">
          <CreatorUsersTable 
            users={users} 
            onEditUser={handleEdit}
            onArchiveUser={handleArchive}
            onDeleteUser={handleDelete}
          />
        </div>

        <Separator />

        {/* Other Roles Users Table */}
        <div className="rounded-md border p-4">
          <OtherRolesUsersTable 
            users={users} 
            onEditUser={handleEdit}
            onArchiveUser={handleArchive}
            onDeleteUser={handleDelete}
          />
        </div>
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

export default RoleBasedUsersList;
