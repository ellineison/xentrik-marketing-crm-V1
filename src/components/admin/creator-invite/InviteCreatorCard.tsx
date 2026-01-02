
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, Copy, Check, UserPlus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { generateInvitationToken } from "@/utils/onboardingUtils";

// Validation schema
const inviteSchema = z.object({
  modelName: z.string().min(1, "Model name is required"),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

const InviteCreatorCard: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string>("");
  const [generatedModelType, setGeneratedModelType] = useState<'new' | 'old' | null>(null);
  const [copied, setCopied] = useState(false);
  
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      modelName: "",
    },
  });

  const handleGenerateLink = async (data: InviteFormValues, modelType: 'new' | 'old') => {
    try {
      setIsLoading(true);
      console.log("Generating link for model:", data.modelName, "type:", modelType);
      
      // Generate invitation token with model name and type
      const result = await generateInvitationToken(data.modelName, modelType);
        
      if (!result.success || !result.token) {
        throw new Error(result.error || "Failed to generate invitation token");
      }

      console.log("Received token from generation:", result.token);

      // Generate the onboarding link
      const appUrl = window.location.origin;
      const onboardingLink = `${appUrl}/onboarding-form/${result.token}`;
      
      console.log("Generated onboarding link:", onboardingLink);
      setGeneratedLink(onboardingLink);
      setGeneratedModelType(modelType);

      toast({
        title: "Onboarding link generated",
        description: `Copy the link and share it with ${data.modelName} (${modelType === 'new' ? 'New Model' : 'Existing Model'})`,
      });
      
      form.reset();
    } catch (error: any) {
      console.error("Error generating link:", error);
      toast({
        variant: "destructive",
        title: "Failed to generate link",
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast({
        title: "Link copied",
        description: "The onboarding link has been copied to your clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Could not copy the link to clipboard",
      });
    }
  };

  const generateNewLink = () => {
    setGeneratedLink("");
    setGeneratedModelType(null);
    setCopied(false);
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 pb-2 p-4 md:p-6">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-lg md:text-xl">Generate Creator Onboarding Link</CardTitle>
          <CardDescription className="text-sm md:text-base mt-1">
            Create a unique onboarding link for creators
          </CardDescription>
        </div>
        <Link className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-2 md:mt-0" />
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        {!generatedLink ? (
          <Form {...form}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="modelName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm md:text-base">Model Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter the model's name" 
                        {...field} 
                        disabled={isLoading}
                        className="h-10 md:h-auto text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  type="button"
                  onClick={form.handleSubmit((data) => handleGenerateLink(data, 'new'))}
                  className="flex-1 h-11 md:h-auto text-base bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600" 
                  disabled={isLoading}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  New Model
                </Button>
                <Button 
                  type="button"
                  onClick={form.handleSubmit((data) => handleGenerateLink(data, 'old'))}
                  className="flex-1 h-11 md:h-auto text-base bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600" 
                  disabled={isLoading}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Existing Model
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                <strong>New Model:</strong> Simplified form (hides pricing fields) &nbsp;|&nbsp; 
                <strong>Existing Model:</strong> Full form with all fields
              </p>
            </div>
          </Form>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label className="text-sm md:text-base">Generated Onboarding Link</Label>
                <span className={`text-xs px-2 py-1 rounded ${
                  generatedModelType === 'new' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {generatedModelType === 'new' ? 'New Model' : 'Existing Model'}
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                <Input 
                  value={generatedLink} 
                  readOnly 
                  className="flex-1 text-xs md:text-sm h-10 md:h-auto"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  disabled={copied}
                  className="h-10 w-10 flex-shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={generateNewLink}
                className="flex-1 h-11 md:h-auto text-base"
              >
                Generate New Link
              </Button>
              <Button
                onClick={copyToClipboard}
                disabled={copied}
                className="flex-1 h-11 md:h-auto text-base"
              >
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InviteCreatorCard;
