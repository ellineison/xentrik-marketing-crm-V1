import React from "react";
import { Card, CardContent } from '@/components/ui/card';

interface Chatter {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AdminPayrollTableProps {
  users: Chatter[];
  onSelectChatter: (chatterId: string) => void;
}

const AdminPayrollTable: React.FC<AdminPayrollTableProps> = ({ 
  users,
  onSelectChatter
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Admin Users ({users.length})</h3>
      {users.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <Card 
              key={user.id} 
              className="bg-secondary/10 border-muted hover:border-primary/50 cursor-pointer transition-colors"
              onClick={() => onSelectChatter(user.id)}
            >
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-1">{user.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  {user.role}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No admin users found
        </div>
      )}
    </div>
  );
};

export default AdminPayrollTable;