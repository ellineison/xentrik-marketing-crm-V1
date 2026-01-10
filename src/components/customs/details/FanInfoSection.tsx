
import React from 'react';
import { User } from 'lucide-react';
import { Custom } from '@/types/custom';

interface FanInfoSectionProps {
  custom: Custom;
}

const FanInfoSection: React.FC<FanInfoSectionProps> = ({ custom }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground">Fan Display Name</label>
        <div className="flex items-center mt-1">
          <User className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-foreground">{custom.fan_display_name}</span>
        </div>
      </div>
      
      {custom.fan_username && (
        <div>
          <label className="text-sm font-medium text-muted-foreground">Fan Username</label>
          <div className="mt-1">
            <span className="text-foreground">@{custom.fan_username}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FanInfoSection;
