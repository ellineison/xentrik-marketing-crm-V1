
import React from "react";
import { Employee } from "@/types/employee";
import UserRolesTable from "./UserRolesTable";

interface AdminUsersTableProps {
  users: Employee[];
  onEditUser: (user: Employee) => void;
  onArchiveUser?: (user: Employee) => void;
  onDeleteUser?: (user: Employee) => void;
}

const AdminUsersTable: React.FC<AdminUsersTableProps> = ({ 
  users,
  onEditUser,
  onArchiveUser,
  onDeleteUser
}) => {
  // Filter users who have Admin as primary role
  const adminUsers = users.filter(user => user.role === "Admin");

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Admin Users ({adminUsers.length})</h3>
      {adminUsers.length > 0 ? (
        <UserRolesTable 
          users={adminUsers} 
          onEditUser={onEditUser}
          onArchiveUser={onArchiveUser}
          onDeleteUser={onDeleteUser}
        />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No admin users found
        </div>
      )}
    </div>
  );
};

export default AdminUsersTable;
