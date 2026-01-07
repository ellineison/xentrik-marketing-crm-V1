
import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from 'react-router-dom';
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useTeam } from '@/context/TeamContext';
import { useToast } from '@/hooks/use-toast';
import { teamMemberFormSchema, TeamMemberFormValues } from '@/schemas/teamMemberSchema';
import { PrimaryRole } from '@/types/employee';
import TeamBasicInfoSection from './TeamBasicInfoSection';
import TeamRolesSection from './TeamRolesSection';

const OnboardingTeamMemberForm = () => {
  const navigate = useNavigate();
  const { addTeamMember } = useTeam();
  const { toast } = useToast();

  const form = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberFormSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'Employee',
      status: 'Active',
      telegram: '',
      department: '',
      roles: []
    }
  });

  const onSubmit = async (data: TeamMemberFormValues) => {
    try {
      // Generate a random password for the new team member
      const tempPassword = Math.random().toString(36).slice(-8);
      
      // Convert single role to an array and ensure required fields are present
      const teamMemberData = {
        name: data.name,
        email: data.email,
        role: data.role as "Admin" | "Manager" | "Employee",
        roles: (data.roles || []) as PrimaryRole[],
        status: data.status || 'Active' as const,
        telegram: data.telegram || '',
        department: data.department || '',
        teams: [] as ("A" | "B" | "C")[],
      };
      
      await addTeamMember(teamMemberData, tempPassword);
      
      toast({
        title: "Success",
        description: `${data.name} has been added to the team`,
      });
      
      navigate('/team');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add team member",
        variant: "destructive"
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto">
        <TeamBasicInfoSection control={form.control} />
        <TeamRolesSection control={form.control} />
        
        <Button type="submit" className="w-full">
          Add Team Member
        </Button>
      </form>
    </Form>
  );
};

export default OnboardingTeamMemberForm;
