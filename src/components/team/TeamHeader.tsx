
import React, { useState } from 'react';
import { Users, SlidersHorizontal, UserPlus, Filter, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TeamMemberRole } from '@/types/employee';
import { TeamFilters } from '@/types/team';
import { useNavigate } from 'react-router-dom';

interface TeamHeaderProps {
  memberCount: number;
  isLoading: boolean;
  filters: TeamFilters;
  onFiltersChange: (filters: TeamFilters) => void;
  onClearFilters: () => void;
}

const TeamHeader: React.FC<TeamHeaderProps> = ({
  memberCount,
  isLoading,
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState(filters.searchQuery);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onFiltersChange({
      ...filters,
      searchQuery: e.target.value
    });
  };
  
  const toggleRole = (role: TeamMemberRole) => {
    const newRoles = filters.roles.includes(role) ? filters.roles.filter(r => r !== role) : [...filters.roles, role];
    onFiltersChange({
      ...filters,
      roles: newRoles
    });
  };
  
  const toggleTeam = (team: "A" | "B" | "C") => {
    const newTeams = filters.teams.includes(team) ? filters.teams.filter(t => t !== team) : [...filters.teams, team];
    onFiltersChange({
      ...filters,
      teams: newTeams
    });
  };
  
  const toggleStatus = (status: "Active" | "Inactive" | "Paused") => {
    const newStatus = filters.status.includes(status) ? filters.status.filter(s => s !== status) : [...filters.status, status];
    onFiltersChange({
      ...filters,
      status: newStatus
    });
  };

  return (
    <div className="mb-8">
      {/* Header with Count and Add Button - Adjusted spacing and sizing */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        {/* Left: Icon + Title */}
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-white" />
          <h1 className="text-2xl font-bold text-white">Total Team Members: 
            <span className="ml-2 text-brand-yellow">{isLoading ? "..." : memberCount}</span>
          </h1>
        </div>
        
        {/* Add Team Member Button */}
        <div>
          <Button 
            onClick={() => navigate('/team/onboard')} 
            variant="premium" 
            className="flex items-center gap-2 shadow-premium-yellow hover:shadow-premium-highlight h-10"
          >
            <Plus className="h-4 w-4" />
            Onboard Team Member
          </Button>
        </div>
      </div>
      
      {/* Search and Filters - Adjusted to match CreatorsHeader */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search field */}
        <div className="relative flex-1">
          <Input 
            placeholder="Search by name or email..." 
            className="pl-10 h-10 w-full bg-background border-white/20 text-white" 
            value={searchValue} 
            onChange={handleSearchChange} 
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <SlidersHorizontal className="h-4 w-4 text-white" />
          </span>
        </div>
        
        {/* Role Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="rounded-full flex gap-2 items-center min-w-[120px] h-10 border-white/20 text-white"
            >
              <SlidersHorizontal className="h-4 w-4 text-white" />
              Roles
              {filters.roles.length > 0 && 
                <span className="ml-1 bg-white/10 text-xs px-2 py-0.5 rounded-full text-white">
                  {filters.roles.length}
                </span>
              }
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-50 w-44 bg-background border-white/20">
            <DropdownMenuLabel className="text-white">Filter by role</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/20" />
            {["Admin", "Manager", "Employee"].map(role => (
              <DropdownMenuCheckboxItem 
                key={role} 
                checked={filters.roles.includes(role as TeamMemberRole)} 
                onCheckedChange={() => toggleRole(role as TeamMemberRole)} 
                className="text-white"
              >
                {role}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Team Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="rounded-full flex gap-2 items-center min-w-[120px] h-10 border-white/20 text-white"
            >
              <Users className="h-4 w-4 text-white" />
              Teams
              {filters.teams.length > 0 && 
                <span className="ml-1 bg-white/10 text-xs px-2 py-0.5 rounded-full text-white">
                  {filters.teams.length}
                </span>
              }
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-50 w-44 bg-background border-white/20">
            <DropdownMenuLabel className="text-white">Filter by team</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/20" />
            {["A", "B", "C"].map(team => (
              <DropdownMenuCheckboxItem 
                key={team} 
                checked={filters.teams.includes(team as any)} 
                onCheckedChange={() => toggleTeam(team as any)} 
                className="text-white"
              >
                Team {team}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="rounded-full flex gap-2 items-center min-w-[120px] h-10 border-white/20 text-white"
            >
              <Filter className="h-4 w-4 text-white" />
              Status
              {filters.status.length > 0 && 
                <span className="ml-1 bg-white/10 text-xs px-2 py-0.5 rounded-full text-white">
                  {filters.status.length}
                </span>
              }
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-50 w-44 bg-background border-white/20">
            <DropdownMenuLabel className="text-white">Filter by status</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/20" />
            {["Active", "Inactive", "Paused"].map(status => (
              <DropdownMenuCheckboxItem 
                key={status} 
                checked={filters.status.includes(status as any)} 
                onCheckedChange={() => toggleStatus(status as any)} 
                className="text-white"
              >
                {status}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Clear button if any filters are active */}
        {(filters.roles.length > 0 || filters.teams.length > 0 || filters.status.length > 0 || filters.searchQuery) && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-10 text-white hover:text-white/80" 
            onClick={onClearFilters}
          >
            <span className="mr-1">Clear</span>
            <Filter className="h-4 w-4 text-white" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default TeamHeader;
