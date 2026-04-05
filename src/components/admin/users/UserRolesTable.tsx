
import React from "react";
import { Employee } from "@/types/employee";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Archive, UserX } from "lucide-react";

interface UserRolesTableProps {
  users: Employee[];
  onEditUser: (user: Employee) => void;
  onArchiveUser?: (user: Employee) => void;
  onDeleteUser?: (user: Employee) => void;
}

const UserRolesTable: React.FC<UserRolesTableProps> = ({ 
  users,
  onEditUser,
  onArchiveUser,
  onDeleteUser
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">User</TableHead>
          <TableHead className="w-[150px]">Email</TableHead>
          <TableHead className="w-[100px]">Primary Role</TableHead>
          <TableHead>Additional Roles</TableHead>
          <TableHead className="w-[100px]">Status</TableHead>
          <TableHead className="w-[120px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                {user.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.name} 
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    {user.name.charAt(0)}
                  </div>
                )}
                <span>{user.name}</span>
              </div>
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge className="bg-brand-yellow text-black">
                {user.role}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((role, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Badge 
                className={
                  user.status === "Active" ? "bg-green-500" : 
                  user.status === "Paused" ? "bg-amber-500" : 
                  "bg-red-500"
                }
              >
                {user.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onEditUser(user)}
                  className="hover:bg-transparent p-0 h-8 w-8"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                
                {onArchiveUser && user.status !== "Inactive" && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onArchiveUser(user)}
                    className="hover:bg-transparent p-0 h-8 w-8 text-amber-500 hover:text-amber-600"
                    title="Archive User"
                  >
                    <Archive className="h-4 w-4" />
                    <span className="sr-only">Archive</span>
                  </Button>
                )}
                
                {onDeleteUser && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onDeleteUser(user)}
                    className="hover:bg-transparent p-0 h-8 w-8 text-destructive hover:text-destructive/80"
                  >
                    <UserX className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default UserRolesTable;
