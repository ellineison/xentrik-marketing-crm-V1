
import React from "react";
import { FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { EXCLUSIVE_ROLES } from "../users/constants";
import { UseFormWatch } from "react-hook-form";
import { TeamMemberFormData } from "./schema";

interface AdditionalRolesFieldProps {
  availableRoles: string[];
  selectedRoles: string[];
  isRoleDisabled: (role: string) => boolean;
  handleRoleChange: (checked: boolean | string, role: string) => void;
}

const AdditionalRolesField: React.FC<AdditionalRolesFieldProps> = ({
  availableRoles,
  selectedRoles,
  isRoleDisabled,
  handleRoleChange
}) => {
  return (
    <div className="space-y-3">
      <div className="text-center">
        <FormLabel>Additional Roles</FormLabel>
        <p className="text-sm text-muted-foreground">
          Select all roles that apply to this user
        </p>
        <p className="text-xs text-amber-500">
          Note: Creator is an exclusive role and cannot be combined with other roles
        </p>
      </div>
      
      <div className="flex justify-center">
        <div className="w-96 p-4">
          <div className="grid grid-cols-2 gap-4">
            {availableRoles.map((role) => (
              <div key={role} className="flex items-center space-x-2">
                <Checkbox 
                  id={`role-${role}`}
                  checked={selectedRoles.includes(role)}
                  onCheckedChange={(checked) => handleRoleChange(checked, role)}
                  disabled={isRoleDisabled(role)}
                  className={isRoleDisabled(role) ? "opacity-50" : ""}
                />
                <label 
                  htmlFor={`role-${role}`}
                  className={`text-sm cursor-pointer ${isRoleDisabled(role) ? "text-muted-foreground" : ""}`}
                >
                  {role}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalRolesField;
