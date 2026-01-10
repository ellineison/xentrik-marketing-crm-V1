
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  creatorOnboardingSchema, 
  CreatorOnboardingFormValues,
  defaultOnboardingValues
} from "@/schemas/creatorOnboardingSchema";
import { useToast } from "@/hooks/use-toast";
import { saveOnboardingData, validateToken } from "@/utils/onboardingUtils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";

const CreatorInviteOnboarding = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invitationData, setInvitationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState("basic");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<CreatorOnboardingFormValues>({
    resolver: zodResolver(creatorOnboardingSchema),
    defaultValues: defaultOnboardingValues,
  });

  // Validate invitation only when component mounts
  useEffect(() => {
    const checkInvitation = async () => {
      try {
        if (!token) {
          throw new Error("No invitation token provided");
        }

        console.log("Checking invitation for token:", token);

        // Validate the token using our utility function
        const isValid = await validateToken(token);
        
        if (!isValid) {
          throw new Error("This invitation is invalid, expired, or has already been used");
        }

        // If token is valid, we can proceed
        console.log("Valid invitation found for token:", token);
        setInvitationData({ token, valid: true });
        
      } catch (error: any) {
        console.error("Error validating invitation:", error);
        toast({
          variant: "destructive",
          title: "Invalid invitation",
          description: error.message || "This onboarding link is invalid or has expired.",
        });
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkInvitation();
  }, [token, navigate, toast]);

  const handleSubmit = async (formData: CreatorOnboardingFormValues) => {
    if (!token || !invitationData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid invitation data",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log("Submitting onboarding data with token:", token);
      
      // Use the utility function to save the data
      const result = await saveOnboardingData(formData, token);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to submit onboarding data");
      }

      console.log("Onboarding submission successful:", result.submissionId);
      setIsSubmitted(true);
      
      toast({
        title: "Success!",
        description: "Your profile has been submitted successfully.",
      });
      
      // Redirect after a delay
      setTimeout(() => {
        navigate("/");
      }, 5000);
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Loading</CardTitle>
            <CardDescription>Please wait while we verify your invitation</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success message after submission
  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle>Thank You!</CardTitle>
            <CardDescription>
              Your profile information has been submitted successfully.
              Our team will review your submission and get back to you soon.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            You will be redirected to the homepage in a few seconds...
          </CardContent>
        </Card>
      </div>
    );
  }

  // The main onboarding form with tabs for different sections
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="w-full mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Complete Your Creator Profile</CardTitle>
            <CardDescription>
              Please provide your information to set up your creator account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <Tabs value={currentStep} onValueChange={setCurrentStep}>
                <TabsList className="grid grid-cols-3 mb-6">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="social">Social Media</TabsTrigger>
                  <TabsTrigger value="additional">Additional Info</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic">
                  <div className="space-y-4">
                    <p className="text-center text-muted-foreground py-8">
                      This is where the Basic Info form fields would be rendered.
                      For this example, we're keeping it simple.
                    </p>
                    
                    <div className="flex justify-between mt-6">
                      <div></div>
                      <Button type="button" onClick={() => setCurrentStep("social")}>
                        Next: Social Media
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="social">
                  <div className="space-y-4">
                    <p className="text-center text-muted-foreground py-8">
                      This is where the Social Media form fields would be rendered.
                      For this example, we're keeping it simple.
                    </p>
                    
                    <div className="flex justify-between mt-6">
                      <Button type="button" variant="outline" onClick={() => setCurrentStep("basic")}>
                        Back: Basic Info
                      </Button>
                      <Button type="button" onClick={() => setCurrentStep("additional")}>
                        Next: Additional Info
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="additional">
                  <div className="space-y-4">
                    <p className="text-center text-muted-foreground py-8">
                      This is where the Additional Info form fields would be rendered.
                      For this example, we're keeping it simple.
                    </p>
                    
                    <div className="flex justify-between mt-6">
                      <Button type="button" variant="outline" onClick={() => setCurrentStep("social")}>
                        Back: Social Media
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="flex items-center gap-2"
                      >
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Submit Profile
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </CardContent>
        </Card>
        
        <div className="text-center text-sm text-muted-foreground">
          <p>Need help? Contact support@example.com</p>
        </div>
      </div>
    </div>
  );
};

export default CreatorInviteOnboarding;
