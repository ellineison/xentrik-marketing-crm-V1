
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTeam } from '@/context/TeamContext';
import { useAuth } from '@/context/AuthContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { TeamMemberRole } from '@/types/employee';
import TeamMemberEditHeader from '@/components/team/TeamMemberEditHeader';
import TeamMemberEditForm from '@/components/team/TeamMemberEditForm';
import { teamMemberFormSchema, TeamMemberFormValues } from '@/schemas/teamMemberSchema';
import { supabase } from '@/integrations/supabase/client';
import { TeamMember } from '@/types/team';
import { Loader2 } from 'lucide-react';

const TeamMemberEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateTeamMember } = useTeam();
  const { user } = useAuth();
  const { toast } = useToast();
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isCurrentUser = user?.id === id;

  // Fetch team member directly from database
  useEffect(() => {
    const fetchTeamMember = async () => {
      if (!id) {
        setError('No team member ID provided');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setError('Team member not found');
          setLoading(false);
          return;
        }

        // Check if this person has the Creator role
        const roles = data.roles || [];
        if (roles.includes('Creator')) {
          setError('Cannot edit creator profiles in the Teams module');
          setLoading(false);
          return;
        }

        // Format the data
        const formattedMember: TeamMember = {
          id: data.id,
          name: data.name || '',
          email: data.email || '',
          role: (data.role || 'Employee') as "Admin" | "Manager" | "Employee",
          roles: (data.roles || []) as TeamMemberRole[],
          status: (data.status || 'Active') as "Active" | "Inactive" | "Paused" | "Suspended",
          teams: [],
          telegram: data.telegram,
          phoneNumber: data.phone_number,
          lastLogin: data.last_login || 'Never',
          profileImage: data.profile_image,
          department: data.department,
          createdAt: data.created_at,
          geographicRestrictions: data.geographic_restrictions || []
        };

        setTeamMember(formattedMember);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching team member:', err);
        setError(err.message || 'Failed to load team member');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMember();
  }, [id]);

  const form = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberFormSchema),
    defaultValues: {
      name: teamMember?.name || '',
      email: teamMember?.email || '',
      role: teamMember?.role || 'Employee',
      roles: teamMember?.roles || [],
      status: teamMember?.status || 'Active',
      department: teamMember?.department || '',
      telegram: teamMember?.telegram || '',
      phoneNumber: teamMember?.phoneNumber || '',
      profileImage: teamMember?.profileImage || '',
    }
  });

  // Update form when teamMember loads
  useEffect(() => {
    if (teamMember) {
      form.reset({
        name: teamMember.name,
        email: teamMember.email,
        role: teamMember.role,
        roles: teamMember.roles,
        status: teamMember.status,
        department: teamMember.department || '',
        telegram: teamMember.telegram || '',
        phoneNumber: teamMember.phoneNumber || '',
        profileImage: teamMember.profileImage || '',
      });
    }
  }, [teamMember, form]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !teamMember) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">{error || 'Team member not found'}</h1>
      </div>
    );
  }

  const handleSubmit = async (values: TeamMemberFormValues) => {
    try {
      await updateTeamMember(teamMember.id, {
        ...values,
        roles: values.roles as unknown as TeamMemberRole[]
      });
      
      toast({
        title: "Success",
        description: "Team member updated successfully",
      });
      navigate(`/team/${teamMember.id}`);
    } catch (error) {
      console.error('Error updating team member:', error);
      toast({
        title: "Error",
        description: "Failed to update team member",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <TeamMemberEditHeader
        memberName={teamMember.name}
        memberId={teamMember.id}
        isCurrentUser={isCurrentUser}
        onSave={form.handleSubmit(handleSubmit)}
      />
      
      <TeamMemberEditForm
        form={form}
        onSubmit={handleSubmit}
        isCurrentUser={isCurrentUser}
        teamMember={teamMember}
      />
    </div>
  );
};

export default TeamMemberEdit;
