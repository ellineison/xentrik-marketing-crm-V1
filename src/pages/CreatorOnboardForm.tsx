
import React from "react";
import { Card } from "@/components/ui/card";
import { MultiStepForm } from "@/components/onboarding/multi-step/MultiStepForm";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CreatorOnboardForm: React.FC = () => {
  const { token } = useParams();
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full bg-background min-h-screen">
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex items-center gap-2 sm:gap-4 mb-4">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-white text-sm sm:text-base p-2 sm:p-3">
              <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Back to Login</span>
              <span className="xs:hidden">Back</span>
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto">
        <MultiStepForm token={token} />
      </div>
    </div>
  );
};

export default CreatorOnboardForm;
