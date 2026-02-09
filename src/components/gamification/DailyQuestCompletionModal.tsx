import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DailyQuestSlot } from '@/hooks/useDailyQuestSlots';
import { useWordOfTheDay } from '@/hooks/useWordOfTheDay';

interface DailyQuestCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: DailyQuestSlot;
  onSubmitComplete: () => void;
}

const DailyQuestCompletionModal: React.FC<DailyQuestCompletionModalProps> = ({
  open,
  onOpenChange,
  slot,
  onSubmitComplete,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { dailyWord } = useWordOfTheDay();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const quest = slot.quest;

  // Check if this is a Word of the Day quest
  const isWordOfDayQuest = quest?.title?.toLowerCase().includes('word of the day');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<string[]> => {
    if (!user || files.length === 0) return [];

    const urls: string[] = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${slot.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('quest-submissions')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload ${file.name}`);
      }

      const { data: urlData } = supabase.storage
        .from('quest-submissions')
        .getPublicUrl(fileName);

      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!user || !quest) return;

    setIsSubmitting(true);
    try {
      // Upload any files first
      let attachmentUrls: string[] = [];
      if (files.length > 0) {
        attachmentUrls = await uploadFiles();
      }

      // Create a quest assignment for this daily slot if it doesn't exist
      // First check if an assignment exists for this quest today
      const today = new Date().toISOString().split('T')[0];
      
      let { data: existingAssignment } = await supabase
        .from('gamification_quest_assignments')
        .select('id')
        .eq('quest_id', quest.id)
        .eq('start_date', today)
        .eq('end_date', today)
        .maybeSingle();

      let assignmentId = existingAssignment?.id;

      // If no assignment exists, create one automatically for this daily quest
      if (!assignmentId) {
        const { data: newAssignment, error: assignmentError } = await supabase
          .from('gamification_quest_assignments')
          .insert({
            quest_id: quest.id,
            start_date: today,
            end_date: today,
            assigned_by: user.id
          })
          .select('id')
          .single();

        if (assignmentError) {
          throw new Error('Failed to create quest assignment');
        }
        assignmentId = newAssignment.id;
      }

      // Now create the completion record
      const { error: completionError } = await supabase
        .from('gamification_quest_completions')
        .insert({
          quest_assignment_id: assignmentId,
          chatter_id: user.id,
          status: 'pending',
          xp_earned: 0,
          bananas_earned: 0,
          attachments: attachmentUrls.length > 0 ? attachmentUrls : null
        });

      if (completionError) {
        // Check if already submitted
        if (completionError.code === '23505') {
          throw new Error('You have already submitted this quest today');
        }
        throw new Error('Failed to submit completion');
      }

      // Mark the slot as completed locally
      const { error: slotError } = await supabase
        .from('gamification_daily_quest_slots')
        .update({ completed: true })
        .eq('id', slot.id);

      if (slotError) {
        console.error('Error marking slot completed:', slotError);
      }

      toast({
        title: "Quest Submitted! 🎉",
        description: "Your completion is pending admin review.",
      });

      onSubmitComplete();
      onOpenChange(false);
      setFiles([]);
      setUploadedUrls([]);
    } catch (error: any) {
      console.error('Error submitting quest:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit quest completion",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!quest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {quest.title}
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p>{quest.description}</p>
            <div className="flex items-center gap-3 text-sm font-medium">
              <span className="text-primary">+{quest.xp_reward} XP</span>
              <span>🍌 +{quest.banana_reward}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Word of the Day Section */}
        {isWordOfDayQuest && dailyWord && (
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4 my-2">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Today's Word</p>
              <p className="text-2xl font-bold text-primary">{dailyWord.word}</p>
              {dailyWord.part_of_speech && (
                <p className="text-xs text-muted-foreground italic">({dailyWord.part_of_speech})</p>
              )}
              {dailyWord.definition && (
                <p className="text-sm text-muted-foreground mt-2">{dailyWord.definition}</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>Proof of Completion (Screenshots)</Label>
            <div className="flex flex-col gap-2">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm"
                    >
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload screenshots as proof of completing the quest
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || slot.completed}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : slot.completed ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Already Submitted
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Submit Completion
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DailyQuestCompletionModal;
