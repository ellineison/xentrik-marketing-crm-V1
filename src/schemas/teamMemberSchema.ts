
import { z } from "zod";
import { PrimaryRole } from "@/types/employee";

export const teamMemberFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  role: z.enum(["Admin", "Manager", "Employee"] as [PrimaryRole, ...PrimaryRole[]]),
  status: z.enum(["Active", "Inactive", "Paused"]),
  telegram: z.string().optional(),
  department: z.string().optional(),
  roles: z.array(z.string()).default([]),
  profileImage: z.string().optional(),
  assignedCreators: z.array(z.string()).optional(),
  phoneNumber: z.string().optional()
});

export type TeamMemberFormValues = z.infer<typeof teamMemberFormSchema>;
