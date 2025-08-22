
import { useState, useEffect } from "react";
import { PrimaryRole } from "@/types/employee";

export const useRolesManagement = (
  initialPrimaryRole: PrimaryRole,
  initialAdditionalRoles: string[]
) => {
  const [primaryRole, setPrimaryRole] = useState<PrimaryRole>(initialPrimaryRole);
  const [additionalRoles, setAdditionalRoles] = useState<string[]>(initialAdditionalRoles);
  const [pendingRoleChange, setPendingRoleChange] = useState<PrimaryRole | null>(null);
  const [showAdminAlert, setShowAdminAlert] = useState(false);

  // Update state when initial values change (when modal opens with new user)
  useEffect(() => {
    setPrimaryRole(initialPrimaryRole);
    setAdditionalRoles([...initialAdditionalRoles]); // Create fresh copy
  }, [initialPrimaryRole, initialAdditionalRoles.length]); // Only depend on array length, not contents

  const handlePrimaryRoleChange = (newRole: PrimaryRole) => {
    // If changing to Admin, show confirmation dialog
    if (newRole === "Admin") {
      setPendingRoleChange(newRole);
      setShowAdminAlert(true);
    } else {
      setPrimaryRole(newRole);
    }
  };

  const handleConfirmAdminChange = () => {
    console.log("handleConfirmAdminChange called", { pendingRoleChange });
    if (pendingRoleChange) {
      console.log("Setting primary role to:", pendingRoleChange);
      setPrimaryRole(pendingRoleChange);
      // No longer clear additional roles for Admin since it's not exclusive
    }
    console.log("Closing admin alert dialog");
    setShowAdminAlert(false);
    setPendingRoleChange(null);
    console.log("Admin confirmation dialog closed, state reset");
  };

  const handleCancelAdminChange = () => {
    setShowAdminAlert(false);
    setPendingRoleChange(null);
  };

  const toggleAdditionalRole = (role: string) => {
    setAdditionalRoles(prev => {
      if (prev.includes(role)) {
        // Remove role
        return prev.filter(r => r !== role);
      } else {
        // Add role - check if it's an exclusive role
        if (role === "Creator") {
          // Creator is exclusive - replace all roles
          return [role];
        } else {
          // Regular role - add to existing roles (but remove Creator if present since it's exclusive)
          const filteredRoles = prev.filter(r => r !== "Creator");
          return [...filteredRoles, role];
        }
      }
    });
  };

  return {
    primaryRole,
    additionalRoles,
    pendingRoleChange,
    showAdminAlert,
    setShowAdminAlert,
    handlePrimaryRoleChange,
    handleConfirmAdminChange,
    handleCancelAdminChange,
    toggleAdditionalRole
  };
};
