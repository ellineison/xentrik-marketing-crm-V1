
import React from 'react';
import { Form } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { TeamMemberFormValues } from '@/schemas/teamMemberSchema';
import ProfileImageSection from './ProfileImageSection';
import TeamBasicInfoSection from './TeamBasicInfoSection';
import TeamRolesSection from './TeamRolesSection';
import { EmployeeTeam } from '@/types/employee';

export type FormValues = TeamMemberFormValues;

interface TeamMemberEditFormProps {
  form: UseFormReturn<TeamMemberFormValues>;
  onSubmit: (values: TeamMemberFormValues) => void;
  isCurrentUser: boolean;
  teamMember: any;
}

const TeamMemberEditForm: React.FC<TeamMemberEditFormProps> = ({
  form,
  onSubmit,
  isCurrentUser,
  teamMember
}) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Profile Image Section - Full Width at Top */}
        <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border/50">
          <h2 className="text-xl font-semibold mb-4">Profile Image</h2>
          <div className="flex justify-center">
            <ProfileImageSection
              profileImage={form.watch("profileImage") || ""}
              name={form.watch("name") || teamMember.name}
              handleProfileImageChange={(url) => form.setValue("profileImage", url)}
            />
          </div>
        </div>

        {/* Main Content Grid - Two Balanced Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Information */}
          <div className="space-y-6">
            <TeamBasicInfoSection control={form.control} />
          </div>

          {/* Right Column - Roles & Status */}
          <div className="space-y-6">
            <TeamRolesSection control={form.control} />
          </div>
        </div>
      </form>
    </Form>
  );
};

export default TeamMemberEditForm;
