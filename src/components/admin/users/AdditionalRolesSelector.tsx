
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckboxGroup } from "@/components/ui/checkbox-group";
import { Label } from "@/components/ui/label";
import { ADDITIONAL_ROLES, EXCLUSIVE_ROLES } from "./constants";

interface AdditionalRolesSelectorProps {
  additionalRoles: string[];
  toggleAdditionalRole: (role: string) => void;
}

const AdditionalRolesSelector: React.FC<AdditionalRolesSelectorProps> = ({
  additionalRoles,
  toggleAdditionalRole
}) => {
  // Determine if a checkbox should be disabled based on current selections
  const isRoleDisabled = (role: string): boolean => {
    // If current roles include any exclusive role and this isn't that role
    return additionalRoles.some(r => 
      EXCLUSIVE_ROLES.includes(r) && r !== role
    );
  };

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">Additional Roles</h3>
      <p className="text-sm text-muted-foreground">
        Select all roles that apply to this user
      </p>
      <p className="text-xs text-amber-500">
        Note: Creator and Admin are exclusive roles and cannot be combined with other roles
      </p>
      
      <CheckboxGroup className="grid grid-cols-2 gap-2 pt-2">
        {ADDITIONAL_ROLES.map(role => (
          <div key={role} className="flex items-center space-x-2">
            <Checkbox 
              id={`additional-role-${role}`}
              checked={additionalRoles.includes(role)}
              onCheckedChange={() => toggleAdditionalRole(role)}
              disabled={isRoleDisabled(role)}
              className={isRoleDisabled(role) ? "opacity-50" : ""}
            />
            <Label 
              htmlFor={`additional-role-${role}`}
              className={`cursor-pointer ${isRoleDisabled(role) ? "text-muted-foreground" : ""}`}
            >
              {role}
            </Label>
          </div>
        ))}
      </CheckboxGroup>
    </div>
  );
};

export default AdditionalRolesSelector;
