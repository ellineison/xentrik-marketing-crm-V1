
import React from 'react';
import { Custom } from '@/types/custom';

interface TeamInfoSectionProps {
  custom: Custom;
}

const TeamInfoSection: React.FC<TeamInfoSectionProps> = ({ custom }) => {
  if (!custom.endorsed_by && !custom.sent_by) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {custom.endorsed_by && (
        <div>
          <label className="text-sm font-medium text-muted-foreground">Endorsed By</label>
          <div className="mt-1">
            <span className="text-foreground">{custom.endorsed_by}</span>
          </div>
        </div>
      )}
      
      {custom.sent_by && (
        <div>
          <label className="text-sm font-medium text-muted-foreground">Sent By</label>
          <div className="mt-1">
            <span className="text-foreground">{custom.sent_by}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamInfoSection;
