
import React from "react";
import ProfilePicture from "@/components/profile/ProfilePicture";
import BasicInfoSection from "@/components/onboarding/BasicInfoSection";
import MarketingStrategySection from "@/components/onboarding/MarketingStrategySection";
import { CustomSocialLink } from "@/components/onboarding/social/CustomSocialLinkItem";
import { Gender, Team, CreatorType } from "@/types";

interface ValidationErrors {
  name?: string;
  gender?: string;
  team?: string;
  creatorType?: string;
  telegramUsername?: string;
  whatsappNumber?: string;
  contactRequired?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  reddit?: string;
  chaturbate?: string;
  youtube?: string;
  customSocialLinks?: string[];
}

interface OnboardingFormSectionsProps {
  name: string;
  setName: (name: string) => void;
  profileImage: string;
  setProfileImage: (image: string) => void;
  gender: Gender;
  setGender: (gender: Gender) => void;
  team: Team;
  setTeam: (team: Team) => void;
  creatorType: CreatorType;
  setCreatorType: (type: CreatorType) => void;
  telegramUsername: string;
  setTelegramUsername: (username: string) => void;
  whatsappNumber: string;
  setWhatsappNumber: (number: string) => void;
  instagram: string;
  setInstagram: (username: string) => void;
  tiktok: string;
  setTiktok: (username: string) => void;
  twitter: string;
  setTwitter: (username: string) => void;
  reddit: string;
  setReddit: (username: string) => void;
  chaturbate: string;
  setChaturbate: (username: string) => void;
  youtube: string;
  setYoutube: (username: string) => void;
  customSocialLinks: CustomSocialLink[];
  setCustomSocialLinks: (links: CustomSocialLink[]) => void;
  notes: string;
  setNotes: (notes: string) => void;
  marketingStrategy: string[];
  setMarketingStrategy: (strategy: string[]) => void;
  errors: ValidationErrors;
}

const OnboardingFormSections: React.FC<OnboardingFormSectionsProps> = (props) => {
  const {
    name,
    setName,
    profileImage,
    setProfileImage,
    gender,
    setGender,
    team,
    setTeam,
    creatorType,
    setCreatorType,
    telegramUsername,
    setTelegramUsername,
    whatsappNumber,
    setWhatsappNumber,
    instagram,
    setInstagram,
    tiktok,
    setTiktok,
    twitter,
    setTwitter,
    reddit,
    setReddit,
    chaturbate,
    setChaturbate,
    youtube,
    setYoutube,
    customSocialLinks,
    setCustomSocialLinks,
    notes,
    setNotes,
    marketingStrategy,
    setMarketingStrategy,
    errors
  } = props;

  return (
    <div className="space-y-6">
      {/* Basic Information and Profile Picture */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="lg:col-span-2 bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border/50">
          <BasicInfoSection 
            name={name}
            setName={setName}
            gender={gender}
            setGender={setGender}
            team={team}
            setTeam={setTeam}
            creatorType={creatorType}
            setCreatorType={setCreatorType}
            errors={errors}
          />
        </div>
        
        {/* Profile Picture */}
        <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border/50 flex flex-col items-center justify-center">
          <ProfilePicture
            profileImage={profileImage}
            name={name || "New Creator"}
            setProfileImage={setProfileImage}
          />
        </div>
      </div>

      {/* Marketing Strategy */}
      <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border/50">
        <MarketingStrategySection
          marketingStrategy={marketingStrategy}
          setMarketingStrategy={setMarketingStrategy}
        />
      </div>
    </div>
  );
};

export default OnboardingFormSections;
