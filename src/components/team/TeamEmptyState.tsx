
import React from 'react';
import { Users, UserSearch, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TeamEmptyStateProps {
  hasFilters: boolean;
  onAddClick?: () => void;
}

const TeamEmptyState: React.FC<TeamEmptyStateProps> = ({
  hasFilters,
  onAddClick
}) => {
  return (
    <div className="text-center py-16 bg-muted/30 rounded-lg border border-border mt-4">
      <div className="flex justify-center">
        {hasFilters ? (
          <UserSearch className="h-16 w-16 text-muted-foreground mb-4" />
        ) : (
          <Users className="h-16 w-16 text-muted-foreground mb-4" />
        )}
      </div>
      
      <h3 className="text-xl font-semibold mb-2">
        {hasFilters 
          ? "No team members match your filters" 
          : "No team members yet"}
      </h3>
      
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        {hasFilters 
          ? "Try adjusting your filters or adding new team members to your organization." 
          : "Get started by adding your first team member to your organization."}
      </p>
      
      {onAddClick && !hasFilters && (
        <Button 
          onClick={onAddClick}
          className="text-black rounded-[15px] px-6 py-2 transition-all hover:bg-gradient-premium-yellow hover:text-black hover:-translate-y-0.5 hover:shadow-premium-yellow hover:opacity-90 bg-gradient-premium-yellow shadow-premium-yellow"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Team Member
        </Button>
      )}
      
      {hasFilters && (
        <Button 
          variant="outline"
          onClick={onAddClick}
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
};

export default TeamEmptyState;
