
import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, ChevronRight, Save, Upload, CheckCircle2, Download } from "lucide-react";
import { 
  creatorOnboardingSchema,
  defaultOnboardingValues,
  CreatorOnboardingFormValues
} from "@/schemas/creatorOnboardingSchema";
import { PersonalInfoForm } from "./PersonalInfoForm";
import { PhysicalAttributesForm } from "./PhysicalAttributesForm";
import { PersonalPreferencesForm } from "./PersonalPreferencesForm";
import { ContentAndServiceForm } from "./ContentAndServiceForm";
import { saveOnboardingData, validateToken, getInvitationModelType } from "@/utils/onboardingUtils";

interface MultiStepFormProps {
  token?: string;
}

export const MultiStepForm: React.FC<MultiStepFormProps> = ({ token }) => {
  const [currentStep, setCurrentStep] = useState<string>("personalInfo");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<CreatorOnboardingFormValues | null>(null);
  const [modelType, setModelType] = useState<'new' | 'old'>('old');
  const { toast } = useToast();
  
  const methods = useForm<CreatorOnboardingFormValues>({
    resolver: zodResolver(creatorOnboardingSchema),
    defaultValues: defaultOnboardingValues,
    mode: "onSubmit"
  });

  const { formState: { errors, isValid } } = methods;
  
  // Debug form state
  console.log("Form errors:", errors);
  console.log("Form isValid:", isValid);

  // Validate token and get model type on component mount
  useEffect(() => {
    if (token) {
      Promise.all([
        validateToken(token),
        getInvitationModelType(token)
      ]).then(([isValid, type]) => {
        setTokenValid(isValid);
        setModelType(type || 'old');
        console.log("Token validation result:", isValid, "Model type:", type);
        if (!isValid) {
          toast({
            title: "Invalid or Expired Link",
            description: "This onboarding link is invalid or has already been used.",
            variant: "destructive",
          });
        }
      });
    } else {
      setTokenValid(true); // No token required for admin access
    }
  }, [token, toast]);

  const steps = [
    { id: "personalInfo", label: "Personal Info" },
    { id: "physicalAttributes", label: "Physical Attributes" },
    { id: "personalPreferences", label: "Preferences" },
    { id: "contentAndService", label: "Content & Services" }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  
  const goToNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
      // Scroll to top for better UX with a small delay to ensure DOM updates
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
      // Scroll to top for better UX with a small delay to ensure DOM updates
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  };

  const handleContentGuideDownload = () => {
    if (!submittedData) return;
    
    const sex = submittedData.personalInfo.sex;
    let docId: string;
    let filename: string;
    
    // Set document ID based on sex field
    if (sex === 'Female') {
      docId = '1LcUGvtlCQsZFGliXHTxCUcV8U6LARvKjDpKD55yKHqs';
      filename = 'Female-Content-Guide.pdf';
    } else if (sex === 'Male') {
      docId = '1jtIRCBXkA39yl7DBm_ELwThotLc3QC6-IlHjAyUxSMQ';
      filename = 'Male-Content-Guide.pdf';
    } else {
      // Transgender or other - no file available
      return;
    }
    
    const pdfExportUrl = `https://docs.google.com/document/d/${docId}/export?format=pdf`;
    
    // Create a temporary link element to trigger download
    const link = document.createElement('a');
    link.href = pdfExportUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFinalSubmit = async (data: CreatorOnboardingFormValues) => {
    console.log("handleFinalSubmit called with data:", data);
    try {
      setIsSubmitting(true);
      console.log("Form data being submitted:", data);

      // Format date of birth from YYYY-MM-DD to "March 08, 2002" format
      if (data.personalInfo.dateOfBirth) {
        const dateObject = new Date(data.personalInfo.dateOfBirth);
        // Check if the date is valid
        if (!isNaN(dateObject.getTime())) {
          data.personalInfo.dateOfBirth = format(dateObject, "MMMM dd, yyyy");
        }
      }

      // For new models, ensure pricing fields are null
      if (modelType === 'new') {
        data.contentAndService.pricePerMinute = null;
        data.contentAndService.customVideoNotes = null;
        data.contentAndService.videoCallPrice = null;
        data.contentAndService.videoCallNotes = null;
        data.contentAndService.dickRatePrice = null;
        data.contentAndService.dickRateNotes = null;
        data.contentAndService.underwearSellingPrice = null;
        data.contentAndService.underwearSellingNotes = null;
      }

      // Save to Supabase with the provided token
      const result = await saveOnboardingData(data, token);
      
      if (result.success) {
        toast({
          title: "Submission Successful",
          description: "Your onboarding information has been submitted successfully.",
          variant: "default",
        });
        setSubmittedData(data);
        setIsSubmitted(true);
      } else {
        throw new Error(result.error || "Failed to submit form");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while validating token
  if (token && tokenValid === null) {
    return (
      <Card className="w-full bg-[#1a1a33]/70 border-[#252538]/50 shadow-xl">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Upload className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-white">Validating invitation link...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state for invalid token
  if (token && tokenValid === false) {
    return (
      <Card className="w-full bg-[#1a1a33]/70 border-[#252538]/50 shadow-xl">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-400 mb-4">This onboarding link is invalid or has expired.</p>
            <p className="text-gray-400">Please contact an administrator for a new link.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show success state after submission
  if (isSubmitted) {
    const sex = submittedData?.personalInfo.sex;
    const hasContentGuide = sex === 'Female' || sex === 'Male';
    
    return (
      <Card className="w-full bg-[#1a1a33]/70 border-[#252538]/50 shadow-xl">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center max-w-md">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Form Successfully Submitted!</h2>
            <p className="text-gray-300 mb-6">
              Thank you for completing the onboarding process. Your information has been received and will be reviewed by our team.
            </p>
            {hasContentGuide ? (
              <>
                <p className="text-gray-300 mb-6">
                  To get started with creating content, download our comprehensive content guide below. This guide will help you understand our content requirements and best practices.
                </p>
                <Button 
                  onClick={handleContentGuideDownload}
                  className="mb-6 bg-gradient-premium-yellow text-black hover:shadow-premium-yellow"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Content Guide
                </Button>
              </>
            ) : (
              <p className="text-gray-300 mb-6">
                We'll provide you with specific content guidelines during our review process.
              </p>
            )}
            <p className="text-gray-400 text-sm">
              You can now close this page. We'll be in touch soon!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const onFormSubmit = (e: React.FormEvent) => {
    // Prevent implicit submissions (e.g., pressing Enter) on all steps.
    // Submission is triggered explicitly via the primary button click.
    e.preventDefault();
  };

  const isLastStep = currentStepIndex === steps.length - 1;

  const handlePrimaryAction = () => {
    if (isLastStep) {
      // Trigger RHF submission explicitly (no native form submit).
      void methods.handleSubmit(handleFinalSubmit)();
      return;
    }

    goToNextStep();
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={onFormSubmit} className="space-y-4 sm:space-y-6 lg:space-y-8">
        <Card className="w-full bg-[#1a1a33]/70 border-[#252538]/50 shadow-xl">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Creator Onboarding</CardTitle>
              {modelType === 'new' && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  New Model Form
                </span>
              )}
            </div>
            <CardDescription className="text-sm sm:text-base">
              Complete the form to save <span className="bg-gradient-premium-yellow bg-clip-text text-transparent font-semibold">information that you want us to publicly and consistently tell the fans</span>. We promise to save this data securely.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <Tabs value={currentStep} onValueChange={setCurrentStep} className="w-full">
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 mb-4 sm:mb-6 lg:mb-8 w-full gap-1 sm:gap-0 h-auto p-1">
                {steps.map((step) => (
                  <TabsTrigger 
                    key={step.id} 
                    value={step.id}
                    className="data-[state=active]:bg-gradient-premium-yellow data-[state=active]:text-black text-xs sm:text-sm p-2 sm:p-3 h-auto whitespace-normal text-center"
                  >
                    <span className="block sm:hidden">{step.label.split(' ')[0]}</span>
                    <span className="hidden sm:block">{step.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="personalInfo">
                <PersonalInfoForm />
              </TabsContent>
              
              <TabsContent value="physicalAttributes">
                <PhysicalAttributesForm />
              </TabsContent>
              
              <TabsContent value="personalPreferences">
                <PersonalPreferencesForm />
              </TabsContent>
              
              <TabsContent value="contentAndService">
                <ContentAndServiceForm isNewModel={modelType === 'new'} />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 border-t border-[#252538]/50 pt-4 p-4 sm:p-6">
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousStep}
              disabled={currentStepIndex === 0}
              className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px]"
            >
              <ChevronLeft className="h-4 w-4" /> 
              <span>Previous</span>
            </Button>
            
            <Button
              type="button"
              variant="premium"
              onClick={handlePrimaryAction}
              disabled={isLastStep ? isSubmitting : false}
              className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px]"
            >
              {isLastStep ? (
                isSubmitting ? (
                  <>
                    <span>Processing</span> <Upload className="h-4 w-4 animate-bounce" />
                  </>
                ) : (
                  <>
                    <span>Submit</span> <Save className="h-4 w-4" />
                  </>
                )
              ) : (
                <>
                  <span>Next</span> <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
};

export default MultiStepForm;
