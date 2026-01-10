
import React from "react";
import { useCreatorOnboardingForm } from "@/hooks/useCreatorOnboardingForm";
import OnboardingPageHeader from "@/components/creators/onboarding/OnboardingPageHeader";
import OnboardingFormContainer from "@/components/creators/onboarding/OnboardingFormContainer";
import OnboardingFormSections from "@/components/creators/onboarding/OnboardingFormSections";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

const CreatorOnboarding = () => {
  const { formState, formActions, isSubmitting, handleSubmit } = useCreatorOnboardingForm();
  const { toast } = useToast();
  const navigate = useNavigate();

  const onSubmit = async () => {
    try {
      console.log("Submit button clicked, starting form submission");
      const creatorId = await handleSubmit();
      
      if (!creatorId) {
        console.log("No creator ID returned, form validation may have failed");
        return;
      }
      
      toast({
        title: "Creator saved successfully",
        description: `${formState.name} has been added to your creators.`,
      });
      navigate("/creators");
    } catch (error: any) {
      console.error("Error during creator submission:", error);
      toast({
        title: "Error saving creator",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <OnboardingFormContainer>
        <OnboardingPageHeader 
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
        />
        
        <OnboardingFormSections
          name={formState.name}
          setName={formActions.setName}
          profileImage={formState.profileImage}
          setProfileImage={formActions.setProfileImage}
          gender={formState.gender}
          setGender={formActions.setGender}
          team={formState.team}
          setTeam={formActions.setTeam}
          creatorType={formState.creatorType}
          setCreatorType={formActions.setCreatorType}
          telegramUsername={formState.telegramUsername}
          setTelegramUsername={formActions.setTelegramUsername}
          whatsappNumber={formState.whatsappNumber}
          setWhatsappNumber={formActions.setWhatsappNumber}
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
          notes={formState.notes}
          setNotes={formActions.setNotes}
          marketingStrategy={formState.marketingStrategy}
          setMarketingStrategy={formActions.setMarketingStrategy}
          errors={formState.errors}
        />
      </OnboardingFormContainer>
    </div>
  );
};

export default CreatorOnboarding;
