
import React from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";

interface OnboardingPageHeaderProps {
  isSubmitting: boolean;
  onSubmit: () => void;
}

const OnboardingPageHeader: React.FC<OnboardingPageHeaderProps> = ({
  isSubmitting,
  onSubmit
}) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-3">
        <BackButton to="/creators" />
        <h1 className="text-2xl font-bold text-foreground">Onboard New Creator</h1>
      </div>
      <Button 
        onClick={onSubmit}
        disabled={isSubmitting}
        variant="premium"
        className="rounded-[15px] px-4 py-2 flex items-center"
      >
        <Save className="h-4 w-4 mr-2" />
        {isSubmitting ? "Saving..." : "Save Creator"}
      </Button>
    </div>
  );
};

export default OnboardingPageHeader;
