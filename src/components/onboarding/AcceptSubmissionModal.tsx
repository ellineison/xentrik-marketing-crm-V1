
import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import ProfileImageUploader from '@/components/team/ProfileImageUploader';
import type { Database } from "@/integrations/supabase/types";

// Define the enum types from Supabase
type TeamEnum = Database["public"]["Enums"]["team"];
type CreatorTypeEnum = Database["public"]["Enums"]["creator_type"];

// Define the CreatorData type
interface CreatorData {
  name: string;
  team: TeamEnum;
  creatorType: CreatorTypeEnum;
  profileImage?: string;
}

interface AcceptSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (creatorData: CreatorData) => Promise<void>;
  defaultName: string;
  isLoading: boolean;
}

const AcceptSubmissionModal: React.FC<AcceptSubmissionModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  defaultName,
  isLoading
}) => {
  const [name, setName] = useState(defaultName);
  const [team, setTeam] = useState<TeamEnum>("A Team");
  const [creatorType, setCreatorType] = useState<CreatorTypeEnum>("Real");
  const [profileImage, setProfileImage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use refs to prevent duplicate submissions
  const hasSubmittedRef = useRef(false);
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      setTeam("A Team");
      setCreatorType("Real");
      setProfileImage('');
      setIsSubmitting(false);
      hasSubmittedRef.current = false;
    }
  }, [isOpen, defaultName]);

  const handleAccept = async () => {
    // Multiple protections against double submissions
    console.log("Accept button clicked, checking submission state...");
    console.log("isSubmitting:", isSubmitting);
    console.log("isLoading:", isLoading);
    console.log("hasSubmittedRef.current:", hasSubmittedRef.current);
    
    if (isSubmitting || isLoading || hasSubmittedRef.current) {
      console.log("Preventing duplicate submission attempt");
      return;
    } 
    
    if (!name.trim()) {
      console.log("Name is required");
      return;
    }
    
    try {
      // Set flags to prevent re-entry
      setIsSubmitting(true);
      hasSubmittedRef.current = true;
      
      console.log("AcceptSubmissionModal: Accepting submission with data:", {
        name,
        team,
        creatorType,
        profileImage,
      });
      
      await onAccept({
        name: name.trim(),
        team,
        creatorType,
        profileImage,
      });
      
      console.log("AcceptSubmissionModal: Submission accepted successfully");
    } catch (error) {
      console.error("Error in modal during submission:", error);
      // Only reset the flags on error to allow retrying
      setIsSubmitting(false);
      hasSubmittedRef.current = false;
    }
    // We don't reset the flags here on success 
    // because the modal will close and be reset via the effect
  };

  // Combine all loading/submitting states
  const isButtonDisabled = isLoading || isSubmitting || !name.trim() || hasSubmittedRef.current;

  // Function to safely close the modal
  const handleClose = () => {
    if (!isSubmitting && !isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-card text-foreground border-border mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">Accept Creator Submission</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm md:text-base">
            This will create a new creator account with the email from their submission and set their password to "XentrikBananas". The creator will be able to login with these credentials.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
            <Label htmlFor="name" className="md:text-right font-medium">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="md:col-span-3 bg-muted border-border text-foreground min-h-[44px]"
              disabled={isSubmitting || isLoading}
              placeholder="Enter creator name"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
            <Label htmlFor="team" className="md:text-right font-medium">
              Team
            </Label>
            <Select 
              value={team} 
              onValueChange={(value: TeamEnum) => setTeam(value)}
              disabled={isSubmitting || isLoading}
            >
              <SelectTrigger className="md:col-span-3 bg-muted border-border text-foreground min-h-[44px]">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                <SelectItem value="A Team">A Team</SelectItem>
                <SelectItem value="B Team">B Team</SelectItem>
                <SelectItem value="C Team">C Team</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
            <Label htmlFor="creatorType" className="md:text-right font-medium">
              Creator Type
            </Label>
            <Select 
              value={creatorType} 
              onValueChange={(value: CreatorTypeEnum) => setCreatorType(value)}
              disabled={isSubmitting || isLoading}
            >
              <SelectTrigger className="md:col-span-3 bg-muted border-border text-foreground min-h-[44px]">
                <SelectValue placeholder="Select creator type" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                <SelectItem value="Real">Real</SelectItem>
                <SelectItem value="AI">AI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-2 md:gap-4">
            <Label className="md:text-right md:pt-2 font-medium">
              Profile Image
            </Label>
            <div className="md:col-span-3">
              <ProfileImageUploader
                value={profileImage}
                onChange={setProfileImage}
                name={name}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="text-foreground border-border w-full sm:w-auto min-h-[44px] touch-manipulation order-2 sm:order-1"
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAccept} 
            disabled={isButtonDisabled}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-primary-foreground w-full sm:w-auto min-h-[44px] touch-manipulation order-1 sm:order-2"
          >
            {(isLoading || isSubmitting) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Accept'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AcceptSubmissionModal;
