import React from "react";
import { Card, CardContent } from '@/components/ui/card';

interface Chatter {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ManagerPayrollTableProps {
  users: Chatter[];
  onSelectChatter: (chatterId: string) => void;
}

const ManagerPayrollTable: React.FC<ManagerPayrollTableProps> = ({ 
  users,
  onSelectChatter
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-center">Manager Users ({users.length})</h3>
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
                <div className="flex justify-center">
                  <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded">
                    {user.role}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No manager users found
        </div>
      )}
    </div>
  );
};

export default ManagerPayrollTable;