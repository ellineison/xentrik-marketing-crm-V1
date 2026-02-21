import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, X, ChevronLeft, Camera, FileImage, CheckCircle, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { QuestAssignment } from '@/hooks/useGamification';
import { useEffectiveWord } from '@/hooks/useEffectiveWord';

interface QuestEvidenceUploadProps {
  assignment: QuestAssignment;
  onBack: () => void;
  onSubmitComplete: () => void;
}

interface ProgressSlot {
  slot_number: number;
  attachment_url: string | null;
  isUploading: boolean;
}

const QuestEvidenceUpload: React.FC<QuestEvidenceUploadProps> = ({
  assignment,
  onBack,
  onSubmitComplete,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { effectiveWord } = useEffectiveWord(assignment.quest_id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slots, setSlots] = useState<ProgressSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const quest = assignment.quest;
  
  // Get progress target from quest (default to 1)
  const progressTarget = quest?.progress_target || 1;

  // Load existing progress from database
  useEffect(() => {
    const loadProgress = async () => {
      if (!user || !quest) return;

      setIsLoading(true);
      try {
        // Fetch existing progress
        const { data: existingProgress, error } = await supabase
          .from('gamification_quest_progress')
          .select('*')
          .eq('quest_assignment_id', assignment.id)
          .eq('chatter_id', user.id)
          .order('slot_number', { ascending: true });

        if (error) throw error;

        // Initialize slots based on progress_target
        const initialSlots: ProgressSlot[] = [];
        for (let i = 0; i < progressTarget; i++) {
          const existing = existingProgress?.find(p => p.slot_number === i);
          initialSlots.push({
            slot_number: i,
            attachment_url: existing?.attachment_url || null,
            isUploading: false,
          });
        }
        setSlots(initialSlots);
      } catch (error) {
        console.error('Error loading progress:', error);
        // Initialize empty slots on error
        const emptySlots: ProgressSlot[] = Array.from({ length: progressTarget }, (_, i) => ({
          slot_number: i,
          attachment_url: null,
          isUploading: false,
        }));
        setSlots(emptySlots);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [user, quest, assignment.id, progressTarget]);

  if (!quest) return null;

  const filledSlots = slots.filter(s => s.attachment_url !== null).length;
  const progressPercentage = Math.min((filledSlots / progressTarget) * 100, 100);
  const canSubmit = filledSlots >= progressTarget;

  // Check if this is a Word of the Day quest
  const isWordOfDayQuest = quest.title?.toLowerCase().includes('word of the day');

  const handleSlotUpload = async (slotIndex: number, file: File) => {
    if (!user) return;

    // Update slot to show uploading state
    setSlots(prev => prev.map((s, i) => 
      i === slotIndex ? { ...s, isUploading: true } : s
    ));

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${assignment.id}/slot_${slotIndex}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('quest-submissions')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('quest-submissions')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Save to database (upsert)
      const { error: dbError } = await supabase
        .from('gamification_quest_progress')
        .upsert({
          quest_assignment_id: assignment.id,
          chatter_id: user.id,
          slot_number: slotIndex,
          attachment_url: publicUrl,
        }, {
          onConflict: 'quest_assignment_id,chatter_id,slot_number'
        });

      if (dbError) throw dbError;

      // Update local state
      setSlots(prev => prev.map((s, i) => 
        i === slotIndex ? { ...s, attachment_url: publicUrl, isUploading: false } : s
      ));

      toast({
        title: "Screenshot uploaded!",
        description: `Progress: ${filledSlots + 1}/${progressTarget}`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      setSlots(prev => prev.map((s, i) => 
        i === slotIndex ? { ...s, isUploading: false } : s
      ));
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload screenshot",
        variant: "destructive"
      });
    }
  };

  const handleRemoveSlot = async (slotIndex: number) => {
    if (!user) return;

    try {
      // Delete from database
      const { error } = await supabase
        .from('gamification_quest_progress')
        .delete()
        .eq('quest_assignment_id', assignment.id)
        .eq('chatter_id', user.id)
        .eq('slot_number', slotIndex);

      if (error) throw error;

      // Update local state
      setSlots(prev => prev.map((s, i) => 
        i === slotIndex ? { ...s, attachment_url: null } : s
      ));

      toast({
        title: "Screenshot removed",
      });
    } catch (error: any) {
      console.error('Remove error:', error);
      toast({
        title: "Failed to remove",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    if (!user || !quest) return;
    
    if (!canSubmit) {
      toast({
        title: "Incomplete",
        description: `Please upload ${progressTarget} screenshot${progressTarget > 1 ? 's' : ''} to complete this quest.`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if a completion already exists
      const { data: existingCompletion } = await supabase
        .from('gamification_quest_completions')
        .select('id')
        .eq('quest_assignment_id', assignment.id)
        .eq('chatter_id', user.id)
        .maybeSingle();

      if (existingCompletion) {
        throw new Error('You have already submitted this quest');
      }

      // Collect all attachment URLs from slots
      const attachmentUrls = slots
        .filter(s => s.attachment_url !== null)
        .map(s => s.attachment_url as string);

      // Create the completion record
      const { error: completionError } = await supabase
        .from('gamification_quest_completions')
        .insert({
          quest_assignment_id: assignment.id,
          chatter_id: user.id,
          status: 'pending',
          xp_earned: quest.xp_reward || 0,
          bananas_earned: quest.banana_reward || 0,
          attachments: attachmentUrls
        });

      if (completionError) {
        if (completionError.code === '23505') {
          throw new Error('You have already submitted this quest');
        }
        throw new Error('Failed to submit completion');
      }

      toast({
        title: "Quest Submitted! 🎉",
        description: "Your completion is pending admin review.",
      });

      onSubmitComplete();
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ fontFamily: "'Orbitron', sans-serif" }}>
      {/* Header */}
      <div className="bg-muted/30 p-6 border-b border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 
            className="text-xl font-bold text-foreground uppercase tracking-wide"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            Upload Evidence
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Submit proof of completing: <span className="font-medium text-foreground">{quest.game_name || quest.title}</span>
        </p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-5">
        {/* Word of the Day Section */}
        {isWordOfDayQuest && effectiveWord && (
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                {effectiveWord.isCustom ? "Admin's Word" : "Today's Word"}
              </p>
              <p 
                className="text-2xl font-bold text-primary"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                {effectiveWord.word}
              </p>
              {effectiveWord.description && (
                <p className="text-sm text-muted-foreground mt-2">{effectiveWord.description}</p>
              )}
            </div>
          </div>
        )}

        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              <Label 
                className="text-sm font-bold uppercase tracking-wider"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                Upload Progress
              </Label>
            </div>
            <span 
              className={`text-sm font-bold ${canSubmit ? 'text-green-500' : 'text-primary'}`}
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              {filledSlots} / {progressTarget}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          {canSubmit && (
            <div className="flex items-center gap-2 text-green-500 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>All screenshots uploaded! Ready to submit.</span>
            </div>
          )}
        </div>

        {/* Upload Slots Grid */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Upload {progressTarget} screenshot{progressTarget > 1 ? 's' : ''} as proof of completing the quest
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {slots.map((slot, index) => (
              <div 
                key={index}
                className="relative aspect-square border-2 border-dashed border-border/50 rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
              >
                {slot.isUploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : slot.attachment_url ? (
                  <>
                    <img 
                      src={slot.attachment_url} 
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveSlot(index)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="h-5 w-5 text-green-500 drop-shadow-lg" />
                    </div>
                  </>
                ) : (
                  <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/20 transition-colors">
                    <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground">Slot {index + 1}</span>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleSlotUpload(index, e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 pb-6 flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          Save & Close
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !canSubmit}
          className={`font-bold ${canSubmit ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-muted text-muted-foreground'}`}
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {canSubmit ? 'Submit Quest' : `Need ${progressTarget - filledSlots} more`}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default QuestEvidenceUpload;
