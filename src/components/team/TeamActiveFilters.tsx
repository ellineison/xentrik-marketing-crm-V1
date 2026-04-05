
import React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TeamMemberRole } from '@/types/employee';
import { TeamFilters } from '@/types/team';

interface TeamActiveFiltersProps {
  filters: TeamFilters;
  onFiltersChange: (filters: TeamFilters) => void;
  onClearFilters: () => void;
}

const TeamActiveFilters: React.FC<TeamActiveFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const removeRole = (role: TeamMemberRole) => {
    onFiltersChange({
      ...filters,
      roles: filters.roles.filter(r => r !== role)
    });
  };

  const removeTeam = (team: "A" | "B" | "C") => {
    onFiltersChange({
      ...filters,
      teams: filters.teams.filter(t => t !== team)
    });
  };

  const removeStatus = (status: "Active" | "Inactive" | "Paused") => {
    onFiltersChange({
      ...filters,
      status: filters.status.filter(s => s !== status)
    });
  };

  const hasActiveFilters = filters.roles.length > 0 || 
                          filters.teams.length > 0 || 
                          filters.status.length > 0;

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-4">
      <span className="text-sm text-muted-foreground mr-2">Active filters:</span>
      
      {filters.roles.map(role => (
        <Badge key={role} variant="secondary" className="px-2 py-1 gap-1">
          {role}
          <button onClick={() => removeRole(role)} className="ml-1">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      
      {filters.teams.map(team => (
        <Badge key={team} variant="secondary" className="px-2 py-1 gap-1">
          Team {team}
          <button onClick={() => removeTeam(team)} className="ml-1">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      
      {filters.status.map(status => (
        <Badge key={status} variant="secondary" className="px-2 py-1 gap-1">
          {status}
          <button onClick={() => removeStatus(status)} className="ml-1">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onClearFilters}
        className="ml-auto"
      >
        <X className="h-4 w-4 mr-2" />
        Clear all
      </Button>
    </div>
  );
};

export default TeamActiveFilters;
