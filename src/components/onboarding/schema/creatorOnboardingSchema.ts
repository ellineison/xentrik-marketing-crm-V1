
import { z } from "zod";

// Define the onboarding schema
export const creatorOnboardingSchema = z.object({
  // Basic Info
  name: z.string().min(1, "Name is required"),
  gender: z.enum(["Male", "Female", "Trans", "AI"], {
    required_error: "Please select a gender",
  }),
  email: z.string().email("Please enter a valid email address"),
  bio: z.string().min(1, "Bio is required"),
  
  // Contact Info
  telegramUsername: z.string().min(1, "Telegram username is required"),
  whatsappNumber: z.string().min(1, "WhatsApp number is required"),
  
  // Social Media
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  twitter: z.string().optional(),
  reddit: z.string().optional(),
  youtube: z.string().optional(),
  
  // Custom Social Links (can be extended)
  customSocialLinks: z.array(
    z.object({
      platform: z.string().optional(),
      url: z.string().optional(),
    })
  ).optional(),
  
  // Profile Picture
  profilePicture: z.any().optional(),
  
  // Additional Information
  notes: z.string().optional(),
  
  // Consent
  termsAccepted: z.boolean().default(false),
});

export type CreatorOnboardingFormValues = z.infer<typeof creatorOnboardingSchema>;

// Default values for the form
export const defaultCreatorOnboardingValues: Partial<CreatorOnboardingFormValues> = {
  name: "",
  gender: "Female",
  email: "",
  bio: "",
  telegramUsername: "",
  whatsappNumber: "",
  instagram: "",
  tiktok: "",
  twitter: "",
  reddit: "",
  youtube: "",
  customSocialLinks: [{ platform: "", url: "" }],
  notes: "",
  termsAccepted: false,
};
