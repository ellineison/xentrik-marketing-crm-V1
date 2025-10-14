
import { z } from "zod";

export const personalInfoSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  modelName: z.string().min(1, "Model name is required"),
  nickname: z.string().min(1, "Nickname is required"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  age: z.number().min(1).optional(),
  sex: z.enum(["Female", "Male", "Transgender"], {
    required_error: "Sex is required",
  }),
  location: z.string().min(1, "Location is required"),
  additionalLocationNote: z.string().min(1, "Additional location note is required"),
  hometown: z.string().min(1, "Hometown is required"),
  ethnicity: z.string().min(1, "Ethnicity is required"),
  religion: z.string().min(1, "Religion is required"),
  relationshipStatus: z.string().min(1, "Relationship status is required"),
  handedness: z.enum(["Left", "Right", "Ambidextrous"], {
    required_error: "Handedness is required",
  }),
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
  numberOfKids: z.number().min(0, "Number of kids is required"),
  occupation: z.string().min(1, "Occupation is required"),
  workplace: z.string().min(1, "Workplace is required"),
  placesVisited: z.string().min(1, "Places visited is required"),
  preferredFanNickname: z.string().min(1, "Preferred fan nickname is required"),
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
  hobbies: z.array(z.string()).min(1, "At least one hobby is required"),
  favoriteDrink: z.string().min(1, "Favorite drink is required"),
  canSing: z.boolean().default(false),
  smokes: z.boolean().default(false),
  drinks: z.boolean().default(false),
  isSexual: z.boolean().default(false),
  homeActivities: z.string().min(1, "Home activities are required"),
  morningRoutine: z.string().min(1, "Morning routine is required"),
  likeInPerson: z.string().min(1, "What you like in person is required"),
  dislikeInPerson: z.string().min(1, "What you dislike in person is required"),
  turnOffs: z.string().min(1, "Turn offs are required"),
  favoriteExpression: z.string().min(1, "Favorite expression is required"),
});

export const contentAndServiceSchema = z.object({
  bodyCount: z.number().min(0, "Body count is required"),
  hasFetish: z.boolean().default(false),
  fetishDetails: z.string().optional(),
  doesAnal: z.boolean().default(false),
  hasTriedOrgy: z.boolean().default(false),
  sexToysCount: z.string().min(1, "Sex toys count is required"),
  lovesThreesomes: z.boolean().default(false),
  favoritePosition: z.string().min(1, "Favorite position is required"),
  craziestSexPlace: z.string().min(1, "Craziest sex place is required"),
  fanHandlingPreference: z.string().min(1, "Fan handling preference is required"),
  pricePerMinute: z.number().min(0, "Price per minute is required"),
  customVideoNotes: z.string().min(1, "Custom video notes are required"),
  videoCallPrice: z.number().min(0, "Video call price is required"),
  videoCallNotes: z.string().min(1, "Video call notes are required"),
  sellsUnderwear: z.boolean().default(false),
  dickRatePrice: z.number().min(0, "Dick rate price is required"),
  dickRateNotes: z.string().min(1, "Dick rate notes are required"),
  underwearSellingPrice: z.number().min(0, "Underwear selling price is required"),
  underwearSellingNotes: z.string().min(1, "Underwear selling notes are required"),
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
  age: undefined,
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
  pricePerMinute: 0,
  customVideoNotes: "",
  videoCallPrice: 0,
  videoCallNotes: "",
  sellsUnderwear: false,
  dickRatePrice: 0,
  dickRateNotes: "",
  underwearSellingPrice: 0,
  underwearSellingNotes: "",
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
