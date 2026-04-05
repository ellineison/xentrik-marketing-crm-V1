
export type TeamMemberRole = "Chatter" | "VA" | "Manager" | "Developer" | "Admin" | "Employee" | "Creator" | "HR / Work Force";
export type EmployeeStatus = "Active" | "Inactive" | "Paused";
export type EmployeeTeam = "A" | "B" | "C";

// Alias for backward compatibility with existing code
export type EmployeeRole = TeamMemberRole;

// Define what is allowed as primary roles and additional roles
export type PrimaryRole = "Admin" | "Manager" | "Employee";

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: PrimaryRole;
  roles?: string[];
  status: EmployeeStatus;
  telegram?: string;
  profileImage?: string;
  lastLogin: string;
  createdAt: string;
  department?: string;
  teams?: EmployeeTeam[];
  assignedCreators?: string[]; // IDs of creators assigned to this team member
}

export type EmployeeFilters = {
  roles: TeamMemberRole[];
  statuses: EmployeeStatus[];
  searchQuery: string;
  sortOption: string;
};

// This is the type needed for the filter components
export type FilterRole = TeamMemberRole | "Active" | "Inactive";
