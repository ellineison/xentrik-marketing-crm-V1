
import React from "react";
import { EXCLUSIVE_ROLES } from "@/components/admin/users/constants";

interface Props {
  selected: string[];
  onChange: (role: string) => void;
}

// Update to use the new role options
const AVAILABLE_ROLES = ["Chatter", "VA", "Admin", "Developer", "Creator"];

const RolesSection: React.FC<Props> = ({ selected, onChange }) => {
  // Check if a role should be disabled
  const isRoleDisabled = (role: string): boolean => {
    // If current roles include any exclusive role and this isn't that role
    return selected.some(r => EXCLUSIVE_ROLES.includes(r) && r !== role);
  };
  
  // Handle role selection with exclusive role logic
  const handleRoleChange = (role: string) => {
    let updatedRoles = [...selected];
    
    // If adding a role (not currently selected)
    if (!selected.includes(role)) {
      // Check if it's an exclusive role
      if (EXCLUSIVE_ROLES.includes(role)) {
        // Replace all selections with just this role
        updatedRoles = [role];
      } else {
        // Clear any exclusive roles first
        updatedRoles = updatedRoles.filter(r => !EXCLUSIVE_ROLES.includes(r));
        // Then add the new role
        updatedRoles.push(role);
      }
    } else {
      // Removing a role
      updatedRoles = updatedRoles.filter(r => r !== role);
    }
    
    // Update the parent component with the new roles array
    updatedRoles.forEach(r => {
      if (!selected.includes(r)) {
        onChange(r); // Add role
      }
    });
    
    selected.forEach(r => {
      if (!updatedRoles.includes(r)) {
        onChange(r); // Remove role
      }
    });
  };

  return (
    <div className="bg-card/50 p-6 rounded-xl border border-border/50">
      <h2 className="text-xl font-bold mb-4 text-foreground">Additional Roles</h2>
      <p className="text-xs mb-3 text-amber-600 dark:text-amber-400">
        Note: Creator is an exclusive role and cannot be combined with others
      </p>
      <div className="grid grid-cols-2 gap-3">
        {AVAILABLE_ROLES.map((role) => (
          <label
            key={role}
            className={`flex items-center gap-2 rounded-md border p-3 cursor-pointer transition-all ${
              selected.includes(role)
                ? "bg-primary/20 border-primary/50"
                : "bg-muted border-border"
            } ${isRoleDisabled(role) ? "opacity-50" : ""}`}
          >
            <input
              type="checkbox"
              checked={selected.includes(role)}
              onChange={() => handleRoleChange(role)}
              className="accent-primary w-4 h-4"
              disabled={isRoleDisabled(role)}
            />
            <span className={`text-foreground text-sm ${isRoleDisabled(role) ? "text-foreground/50" : ""}`}>
              {role}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default RolesSection;
