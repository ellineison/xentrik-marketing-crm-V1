
import React from "react";
import { Employee } from "@/types/employee";
import UserRolesTable from "./UserRolesTable";

interface CreatorUsersTableProps {
  users: Employee[];
  onEditUser: (user: Employee) => void;
  onArchiveUser?: (user: Employee) => void;
  onDeleteUser?: (user: Employee) => void;
}

const CreatorUsersTable: React.FC<CreatorUsersTableProps> = ({ 
  users,
  onEditUser,
  onArchiveUser,
  onDeleteUser
}) => {
  // Filter users who have Creator in their additional roles
  const creatorUsers = users.filter(user => 
    user.roles && user.roles.includes("Creator")
  );

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Creator Users ({creatorUsers.length})</h3>
      {creatorUsers.length > 0 ? (
        <UserRolesTable 
          users={creatorUsers} 
          onEditUser={onEditUser}
          onArchiveUser={onArchiveUser}
          onDeleteUser={onDeleteUser}
        />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No creator users found
        </div>
      )}
    </div>
  );
};

export default CreatorUsersTable;
