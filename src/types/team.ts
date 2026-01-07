
import { TeamMemberRole } from "./employee";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Employee";
  roles: TeamMemberRole[];
  status: "Active" | "Inactive" | "Paused" | "Suspended";
  teams: ("A" | "B" | "C")[];
  telegram?: string;
  phoneNumber?: string;
  lastLogin?: string;
  profileImage?: string;
  department?: string;
  createdAt: string;
  geographicRestrictions?: string[];
}

export type TeamMemberFormValues = {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  roles: TeamMemberRole[];
  teams: ("A" | "B" | "C")[];
  telegram?: string;
  phoneNumber?: string;
  department?: string;
  profileImage?: string;
  geographicRestrictions?: string[];
};

export interface TeamFilters {
  roles: TeamMemberRole[];
  teams: ("A" | "B" | "C")[];
  status: ("Active" | "Inactive" | "Paused" | "Suspended")[];
  searchQuery: string;
}
