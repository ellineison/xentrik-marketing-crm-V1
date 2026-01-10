
import React from "react";
import { Form } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { TeamMemberFormValues } from "@/schemas/teamMemberSchema";
import ProfileImageSection from "./ProfileImageSection";
import BasicInfoSection from "./BasicInfoSection";
import CreatorsAssignmentSection from "./CreatorsAssignmentSection";
import FormActions from "./FormActions";
import { EmployeeTeam } from "@/types/employee";

interface ProfileFormContainerProps {
  form: UseFormReturn<TeamMemberFormValues>;
  handleSubmit: (values: TeamMemberFormValues) => void;
  handleBack: () => void;
  isCurrentUser: boolean;
  selectedTeams: EmployeeTeam[];
  toggleTeam: (team: EmployeeTeam) => void;
  selectedCreators: string[];
  toggleCreator: (creatorId: string) => void;
  handleProfileImageChange: (url: string) => void;
  employeeName: string;
}

const ProfileFormContainer: React.FC<ProfileFormContainerProps> = ({
  form,
  handleSubmit,
  handleBack,
  isCurrentUser,
  selectedTeams,
  toggleTeam,
  selectedCreators,
  toggleCreator,
  handleProfileImageChange,
  employeeName
}) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6 max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="flex gap-6 flex-col sm:flex-row">
            <ProfileImageSection 
              profileImage={form.watch("profileImage") || ""}
              name={form.watch("name") || employeeName}
              handleProfileImageChange={handleProfileImageChange}
            />
            
            <BasicInfoSection 
              control={form.control}
              isCurrentUser={isCurrentUser}
            />
          </div>
          

          <CreatorsAssignmentSection 
            selectedCreators={selectedCreators}
            toggleCreator={toggleCreator}
          />
          
          <FormActions 
            handleBack={handleBack}
          />
        </form>
      </Form>
    </div>
  );
};

export default ProfileFormContainer;
