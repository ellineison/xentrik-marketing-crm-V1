
import React from "react";
import { Employee } from "@/types/employee";
import UserRolesTable from "./UserRolesTable";

interface OtherRolesUsersTableProps {
  users: Employee[];
  onEditUser: (user: Employee) => void;
  onArchiveUser?: (user: Employee) => void;
  onDeleteUser?: (user: Employee) => void;
}

const OtherRolesUsersTable: React.FC<OtherRolesUsersTableProps> = ({ 
  users,
  onEditUser,
  onArchiveUser,
  onDeleteUser
}) => {
  // Filter users who have Manager primary role OR other additional roles (not Admin primary, not Creator only)
  const otherRoleUsers = users.filter(user => {
    // Include Manager primary role users
    if (user.role === "Manager") return true;
    
    // Exclude Admin primary role users
    if (user.role === "Admin") return false;
    
    // Exclude users who only have Creator role
    if (user.roles && user.roles.length === 1 && user.roles.includes("Creator")) return false;
    
    // Include users with other additional roles (or Creator + other roles)
    return user.roles && user.roles.length > 0 && 
           user.roles.some(role => ["Chatter", "VA", "Developer"].includes(role));
  });

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Other Role Users ({otherRoleUsers.length})</h3>
      {otherRoleUsers.length > 0 ? (
        <UserRolesTable 
          users={otherRoleUsers} 
          onEditUser={onEditUser}
          onArchiveUser={onArchiveUser}
          onDeleteUser={onDeleteUser}
        />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No users with other roles found
        </div>
      )}
    </div>
  );
};

export default OtherRolesUsersTable;
