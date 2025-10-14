
import React from "react";
import { Button } from "@/components/ui/button";
import ProfilePicture from "../profile/ProfilePicture";
import BasicInfoSection from "./BasicInfoSection";
import ContactInfoSection from "./ContactInfoSection";
import SocialLinksSection from "./SocialLinksSection";
import NotesSection from "./NotesSection";
import { useOnboardingForm } from "@/hooks/useOnboardingForm";

interface OnboardingFormProps {
  onCloseModal?: () => void;
}

const OnboardingForm: React.FC<OnboardingFormProps> = ({ onCloseModal }) => {
  const { formState, formActions, handleSubmit } = useOnboardingForm(onCloseModal);
  
  return (
    <>
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <BasicInfoSection
          name={formState.name}
          setName={formActions.setName}
          gender={formState.gender}
          setGender={formActions.setGender}
          team={formState.team}
          setTeam={formActions.setTeam}
          creatorType={formState.creatorType}
          setCreatorType={formActions.setCreatorType}
          errors={formState.errors}
        />
        
        <div className="flex items-center justify-center">
          <ProfilePicture 
            profileImage={formState.profileImage}
            name={formState.name || "New Creator"}
            setProfileImage={formActions.setProfileImage}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ContactInfoSection
          telegramUsername={formState.telegramUsername}
          setTelegramUsername={formActions.setTelegramUsername}
          whatsappNumber={formState.whatsappNumber}
          setWhatsappNumber={formActions.setWhatsappNumber}
          errors={formState.errors}
        />
        
        <SocialLinksSection
          instagram={formState.instagram}
          setInstagram={formActions.setInstagram}
          tiktok={formState.tiktok}
          setTiktok={formActions.setTiktok}
          twitter={formState.twitter}
          setTwitter={formActions.setTwitter}
          reddit={formState.reddit}
          setReddit={formActions.setReddit}
          chaturbate={formState.chaturbate}
          setChaturbate={formActions.setChaturbate}
          youtube={formState.youtube}
          setYoutube={formActions.setYoutube}
          customSocialLinks={formState.customSocialLinks}
          setCustomSocialLinks={formActions.setCustomSocialLinks}
          errors={formState.errors}
        />
      </div>
      
      <NotesSection 
        notes={formState.notes} 
        setNotes={formActions.setNotes} 
      />
      
      
      <Button 
        onClick={handleSubmit} 
        variant="premium"
        className="w-full mt-4 shadow-premium-yellow"
      >
        Submit
      </Button>
    </>
  );
};

export default OnboardingForm;
