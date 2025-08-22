
import { PrimaryRole } from "@/types/employee";

export const PRIMARY_ROLES: PrimaryRole[] = ["Admin", "Manager", "Employee"];

// Additional roles options - removing "Creator" from this array
export const ADDITIONAL_ROLES: string[] = [
  "Chatter", 
  "VA", 
  "Admin", 
  "Developer",
  "Creator",
  "Marketing Team",
  "Outreach Team",
  "HR / Work Force"
];

// Define exclusive roles that cannot be combined with other roles
export const EXCLUSIVE_ROLES = ["Creator"];
