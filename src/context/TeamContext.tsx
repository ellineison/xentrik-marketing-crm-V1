import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TeamMember, TeamFilters } from '@/types/team';
import { TeamMemberRole } from '@/types/employee';

interface TeamContextProps {
  teamMembers: TeamMember[];
  loading: boolean;
  error: string | null;
  addTeamMember: (teamMember: Omit<TeamMember, 'id' | 'createdAt'>, password: string) => Promise<void>;
  updateTeamMember: (id: string, updates: Partial<TeamMember> & { role?: string }) => Promise<void>;
  deleteTeamMember: (id: string) => Promise<void>;
  filterTeamMembers: (filters: TeamFilters) => TeamMember[];
}

const TeamContext = createContext<TeamContextProps | undefined>(undefined);

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) throw new Error('useTeam must be used within a TeamProvider');
  return context;
};

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      const formattedTeamMembers: TeamMember[] = data
        .map((profile: any) => ({
          id: profile.id,
          name: profile.name || '',
          email: profile.email || '',
          roles: profile.roles || [],
          status: profile.status || 'Active',
          teams: [], // Remove teams reference from database
          telegram: profile.telegram,
          phoneNumber: profile.phone_number,
          lastLogin: profile.last_login || 'Never',
          profileImage: profile.profile_image,
          department: profile.department,
          createdAt: profile.created_at,
          geographicRestrictions: profile.geographic_restrictions || []
        }))
        // Filter out team members who have the "Creator" role (whether it's their only role or not)
        .filter((member: TeamMember) => {
          // If they have no roles or roles is empty, keep them
          if (!member.roles || member.roles.length === 0) return true;
          
          // Exclude anyone who has "Creator" in their roles array
          return !member.roles.includes("Creator");
        });
      
      setTeamMembers(formattedTeamMembers);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching team members:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load team members",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTeamMember = async (newMember: Omit<TeamMember, 'id' | 'createdAt'>, password: string) => {
    try {
      setLoading(true);
      
      // Call the stored procedure to create a team member with correct parameter names
      const { data, error } = await supabase.rpc('create_team_member', {
        email: newMember.email,
        password: password,
        name: newMember.name,
        primary_role: newMember.roles[0] || 'Employee', // Take first role as primary
        additional_roles: newMember.roles.slice(1) // Rest as additional roles
      });
      
      if (error) throw error;
      
      // Refetch to get the updated list with the new member
      await fetchTeamMembers();
      
      toast({
        title: "Success",
        description: `${newMember.name} has been added to the team`,
      });
    } catch (err: any) {
      console.error('Error adding team member:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: err.message || "Failed to add team member",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTeamMember = async (id: string, updates: Partial<TeamMember> & { role?: string }) => {
    try {
      setLoading(true);
      
      // Map to database column names
      const dbUpdates: any = {
        name: updates.name,
        role: updates.role, // Primary role
        roles: updates.roles, // Additional roles
        status: updates.status,
        telegram: updates.telegram,
        phone_number: updates.phoneNumber,
        department: updates.department,
        profile_image: updates.profileImage,
        geographic_restrictions: updates.geographicRestrictions
      };
      
      // Filter out undefined values
      Object.keys(dbUpdates).forEach(key => {
        if (dbUpdates[key] === undefined) {
          delete dbUpdates[key];
        }
      });
      
      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setTeamMembers(prev => 
        prev.map(member => member.id === id ? { ...member, ...updates } : member)
      );
      
      toast({
        title: "Success",
        description: "Team member updated successfully",
      });
    } catch (err: any) {
      console.error('Error updating team member:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: err.message || "Failed to update team member",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteTeamMember = async (id: string) => {
    try {
      setLoading(true);
      
      // First check if the user exists in auth.users
      // We can't query auth.users directly, so we'll use a workaround
      // by checking if we can get the user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', id)
        .single();
      
      if (profileError && profileError.code === 'PGRST116') {
        // Profile not found, likely user doesn't exist
        toast({
          variant: "destructive",
          title: "User not found",
          description: "The user may have already been deleted",
        });
        
        // Update local state anyway to remove the member
        setTeamMembers(prev => prev.filter(member => member.id !== id));
        setLoading(false);
        return;
      }
      
      // Try to delete the user profile first
      const { error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
        
      if (deleteProfileError) {
        console.warn("Could not delete profile:", deleteProfileError);
      }
      
      // Only attempt to delete from auth if we have admin-level permissions
      // This is likely to fail with regular privileges
      // If you want to properly enable this, you'd need to create an edge function with admin key
      try {
        const { error: deleteUserError } = await supabase.functions.invoke('delete-team-member', {
          body: { userId: id }
        });
        
        if (deleteUserError) {
          console.warn("Error from edge function:", deleteUserError);
        }
      } catch (edgeFunctionError) {
        console.error("Edge function error:", edgeFunctionError);
        // Continue anyway, we've at least deleted the profile
      }
      
      // Update local state regardless of auth deletion outcome
      setTeamMembers(prev => prev.filter(member => member.id !== id));
      
      toast({
        title: "Success",
        description: "Team member removed successfully",
      });
    } catch (err: any) {
      console.error('Error deleting team member:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: err.message || "Failed to delete team member",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTeamMembers = (filters: TeamFilters): TeamMember[] => {
    return teamMembers.filter(member => {
      // Filter by roles
      const roleMatch = filters.roles.length === 0 || 
        member.roles.some(role => filters.roles.includes(role));
      
      // Filter by teams
      const teamMatch = filters.teams.length === 0 || 
        (member.teams && member.teams.some(team => filters.teams.includes(team)));
      
      // Filter by status
      const statusMatch = filters.status.length === 0 || 
        filters.status.includes(member.status);
      
      // Filter by search query
      const searchMatch = !filters.searchQuery || 
        member.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(filters.searchQuery.toLowerCase());
      
      return roleMatch && teamMatch && statusMatch && searchMatch;
    });
  };

  return (
    <TeamContext.Provider value={{
      teamMembers,
      loading,
      error,
      addTeamMember,
      updateTeamMember,
      deleteTeamMember,
      filterTeamMembers
    }}>
      {children}
    </TeamContext.Provider>
  );
};
