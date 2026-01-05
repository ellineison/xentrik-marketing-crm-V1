
import { z } from "zod";

// All fields are now optional to allow submission with empty fields
export const personalInfoSchema = z.object({
  fullName: z.string().optional().default(""),
  modelName: z.string().optional().default(""),
  nickname: z.string().optional().default(""),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  dateOfBirth: z.string().optional().default(""),
  modelBirthday: z.string().optional().default(""),
  age: z.number().optional(),
  modelAge: z.number().optional(),
  sex: z.enum(["Female", "Male", "Transgender"]).optional(),
  location: z.string().optional().default(""),
  additionalLocationNote: z.string().optional().default(""),
  hometown: z.string().optional().default(""),
  ethnicity: z.string().optional().default(""),
  religion: z.string().optional().default(""),
  relationshipStatus: z.string().optional().default(""),
  handedness: z.enum(["Left", "Right", "Ambidextrous"]).optional(),
  hasPets: z.boolean().default(false),
  pets: z.array(
    z.object({
      type: z.string().optional(),
      breed: z.string().optional(),
      age: z.string().optional(),
      name: z.string().optional(),
    })
  ).optional(),
  hasKids: z.boolean().default(false),
  numberOfKids: z.number().optional().default(0),
  occupation: z.string().optional().default(""),
  workplace: z.string().optional().default(""),
  placesVisited: z.string().optional().default(""),
  preferredFanNickname: z.string().optional().default(""),
});

export const physicalAttributesSchema = z.object({
  weight: z.string().optional(),
  height: z.string().optional(),
  bodyType: z.string().optional(),
  favoriteColor: z.string().optional(),
  dislikedColor: z.string().optional(),
  allergies: z.string().optional(),
  hasTattoos: z.boolean().default(false),
  tattooDetails: z.string().optional(),
  bustWaistHip: z.string().optional(),
  dickSize: z.string().optional(),
  isCircumcised: z.boolean().optional(),
  isTopOrBottom: z.enum(["Top", "Bottom", "Versatile"]).optional(),
});

export const personalPreferencesSchema = z.object({
  hobbies: z.array(z.string()).optional().default([]),
  favoriteDrink: z.string().optional().default(""),
  canSing: z.boolean().default(false),
  smokes: z.boolean().default(false),
  drinks: z.boolean().default(false),
  isSexual: z.boolean().default(false),
  homeActivities: z.string().optional().default(""),
  morningRoutine: z.string().optional().default(""),
  likeInPerson: z.string().optional().default(""),
  dislikeInPerson: z.string().optional().default(""),
  turnOffs: z.string().optional().default(""),
  favoriteExpression: z.string().optional().default(""),
});

export const contentAndServiceSchema = z.object({
  bodyCount: z.number().optional().default(0),
  hasFetish: z.boolean().default(false),
  fetishDetails: z.string().optional(),
  doesAnal: z.boolean().default(false),
  hasTriedOrgy: z.boolean().default(false),
  sexToysCount: z.string().optional().default(""),
  lovesThreesomes: z.boolean().default(false),
  favoritePosition: z.string().optional().default(""),
  craziestSexPlace: z.string().optional().default(""),
  fanHandlingPreference: z.string().optional().default(""),
  // Pricing fields - will be hidden for new models
  pricePerMinute: z.number().optional().nullable(),
  customVideoNotes: z.string().optional().nullable(),
  videoCallPrice: z.number().optional().nullable(),
  videoCallNotes: z.string().optional().nullable(),
  sellsUnderwear: z.boolean().default(false),
  dickRatePrice: z.number().optional().nullable(),
  dickRateNotes: z.string().optional().nullable(),
  underwearSellingPrice: z.number().optional().nullable(),
  underwearSellingNotes: z.string().optional().nullable(),
  socialMediaHandles: z.object({
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    tiktok: z.string().optional(),
    onlyfans: z.string().optional(),
    snapchat: z.string().optional(),
    other: z.array(
      z.object({
        platform: z.string().optional(),
        handle: z.string().optional(),
      })
    ).optional(),
  }).optional(),
});

export const creatorOnboardingSchema = z.object({
  personalInfo: personalInfoSchema,
  physicalAttributes: physicalAttributesSchema.optional(),
  personalPreferences: personalPreferencesSchema,
  contentAndService: contentAndServiceSchema,
});

export type CreatorOnboardingFormValues = z.infer<typeof creatorOnboardingSchema>;
export type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;
export type PhysicalAttributesFormValues = z.infer<typeof physicalAttributesSchema>;
export type PersonalPreferencesFormValues = z.infer<typeof personalPreferencesSchema>;
export type ContentAndServiceFormValues = z.infer<typeof contentAndServiceSchema>;

export const defaultPersonalInfoValues: PersonalInfoFormValues = {
  fullName: "",
  modelName: "",
  nickname: "",
  email: "",
  dateOfBirth: "",
  modelBirthday: "",
  age: undefined,
  modelAge: undefined,
  sex: "Female",
  location: "",
  additionalLocationNote: "",
  hometown: "",
  ethnicity: "",
  religion: "",
  relationshipStatus: "",
  handedness: "Right",
  hasPets: false,
  pets: [{ type: "", breed: "", age: "", name: "" }],
  hasKids: false,
  numberOfKids: 0,
  occupation: "",
  workplace: "",
  placesVisited: "",
  preferredFanNickname: "",
};

export const defaultPhysicalAttributesValues: PhysicalAttributesFormValues = {
  weight: "",
  height: "",
  bodyType: "",
  favoriteColor: "",
  dislikedColor: "",
  allergies: "",
  hasTattoos: false,
  tattooDetails: "",
  bustWaistHip: "",
  dickSize: "",
  isCircumcised: false,
  isTopOrBottom: "Versatile",
};

export const defaultPersonalPreferencesValues: PersonalPreferencesFormValues = {
  hobbies: [""],
  favoriteDrink: "",
  canSing: false,
  smokes: false,
  drinks: false,
  isSexual: false,
  homeActivities: "",
  morningRoutine: "",
  likeInPerson: "",
  dislikeInPerson: "",
  turnOffs: "",
  favoriteExpression: "",
};

export const defaultContentAndServiceValues: ContentAndServiceFormValues = {
  bodyCount: 0,
  hasFetish: false,
  fetishDetails: "",
  doesAnal: false,
  hasTriedOrgy: false,
  sexToysCount: "",
  lovesThreesomes: false,
  favoritePosition: "",
  craziestSexPlace: "",
  fanHandlingPreference: "",
  pricePerMinute: null,
  customVideoNotes: null,
  videoCallPrice: null,
  videoCallNotes: null,
  sellsUnderwear: false,
  dickRatePrice: null,
  dickRateNotes: null,
  underwearSellingPrice: null,
  underwearSellingNotes: null,
  socialMediaHandles: {
    instagram: "",
    twitter: "",
    tiktok: "",
    onlyfans: "",
    snapchat: "",
    other: [{ platform: "", handle: "" }],
  },
};

export const defaultOnboardingValues: CreatorOnboardingFormValues = {
  personalInfo: defaultPersonalInfoValues,
  physicalAttributes: defaultPhysicalAttributesValues,
  personalPreferences: defaultPersonalPreferencesValues,
  contentAndService: defaultContentAndServiceValues,
};
