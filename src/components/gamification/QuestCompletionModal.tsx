import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, X, Image, ChevronLeft, ChevronRight, Star, Medal, Crown, CheckCircle, BookOpen } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Quest, QuestAssignment } from '@/hooks/useGamification';
import { format } from 'date-fns';
import { useEffectiveWord } from '@/hooks/useEffectiveWord';

interface QuestCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: QuestAssignment;
  onSubmitComplete: () => void;
}

type ModalStep = 'instructions' | 'upload' | 'submitting' | 'success';

const QuestCompletionModal: React.FC<QuestCompletionModalProps> = ({
  open,
  onOpenChange,
  assignment,
  onSubmitComplete
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { effectiveWord } = useEffectiveWord(assignment.quest_id);
  const [step, setStep] = useState<ModalStep>('instructions');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const quest = assignment.quest;
  
  // Check if this is a Word of the Day quest
  const isWordOfDayQuest = quest?.title?.toLowerCase().includes('word of the day');

  const getQuestIcon = (type: string) => {
    switch (type) {
      case 'daily': return <Star className="h-5 w-5 text-yellow-500" />;
      case 'weekly': return <Medal className="h-5 w-5 text-blue-500" />;
      case 'monthly': return <Crown className="h-5 w-5 text-purple-500" />;
      default: return <Star className="h-5 w-5" />;
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Create preview URLs
    const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
    setUploadedFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadAndSubmit = async () => {
    if (!user || uploadedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one screenshot",
        variant: "destructive"
      });
      return;
    }

    setStep('submitting');
    setIsUploading(true);

    try {
      const urls: string[] = [];

      // Upload each file to Supabase storage
      for (const file of uploadedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${assignment.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('custom_attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('custom_attachments')
          .getPublicUrl(fileName);

        urls.push(publicUrl);
      }

      // Create the quest completion record
      const { error: insertError } = await supabase
        .from('gamification_quest_completions')
        .insert({
          chatter_id: user.id,
          quest_assignment_id: assignment.id,
          xp_earned: quest?.xp_reward || 0,
          bananas_earned: quest?.banana_reward || 0,
          status: 'pending',
          attachments: urls
        });

      if (insertError) throw insertError;

      setUploadedUrls(urls);
      setStep('success');

      toast({
        title: "Quest Submitted!",
        description: "Your quest completion is pending admin verification"
      });

      // Clean up preview URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
    } catch (error) {
      console.error('Error submitting quest:', error);
      setStep('upload');
      toast({
        title: "Error",
        description: "Failed to submit quest completion",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    // Clean up
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setStep('instructions');
    setUploadedFiles([]);
    setPreviewUrls([]);
    setUploadedUrls([]);
    
    if (step === 'success') {
      onSubmitComplete();
    }
    onOpenChange(false);
  };

  const resetModal = () => {
    setStep('instructions');
    setUploadedFiles([]);
    setPreviewUrls([]);
    setUploadedUrls([]);
  };

  // Reset when modal opens
  React.useEffect(() => {
    if (open) {
      resetModal();
    }
  }, [open]);

  if (!quest) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        {/* Instructions Step */}
        {step === 'instructions' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                {getQuestIcon(quest.quest_type)}
                <Badge variant="outline" className="capitalize">{quest.quest_type}</Badge>
              </div>
              <DialogTitle className="text-xl mt-2">{quest.title}</DialogTitle>
              <DialogDescription>
                Valid: {format(new Date(assignment.start_date), 'MMM d')} - {format(new Date(assignment.end_date), 'MMM d')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Word of the Day Feature */}
              {isWordOfDayQuest && effectiveWord && (
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-5 w-5 text-purple-400" />
                    <span className="font-semibold text-sm text-purple-400">
                      {effectiveWord.isCustom ? "Admin's Word" : "Today's Word"}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <h3 className="text-2xl font-bold text-purple-300">{effectiveWord.word}</h3>
                  </div>
                  {effectiveWord.description && (
                    <p className="text-sm text-muted-foreground italic">"{effectiveWord.description}"</p>
                  )}
                </div>
              )}

              {/* Instructions */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Instructions</h4>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm leading-relaxed">
                    {quest.description || "Complete this quest and submit screenshots as proof of completion."}
                  </p>
                </div>
              </div>

              {/* Rewards */}
              <div className="flex items-center gap-6 py-3 px-4 bg-primary/5 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">+{quest.xp_reward}</span>
                  <span className="text-sm text-muted-foreground">XP</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🍌</span>
                  <span className="text-lg font-bold text-yellow-600">+{quest.banana_reward}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => setStep('upload')}>
                Done <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Upload Step */}
        {step === 'upload' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ChevronLeft 
                  className="h-5 w-5 cursor-pointer hover:text-primary" 
                  onClick={() => setStep('instructions')} 
                />
                Upload Screenshots
              </DialogTitle>
              <DialogDescription>
                Upload screenshots as proof of completing "{quest.title}"
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isDragActive 
                    ? "Drop the screenshots here..." 
                    : "Drag & drop screenshots, or click to select"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Max 5 images, up to 10MB each
                </p>
              </div>

              {/* Preview uploaded files */}
              {previewUrls.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Uploaded ({previewUrls.length}/5)</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={url} 
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg border"
                        />
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('instructions')}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button 
                onClick={handleUploadAndSubmit} 
                disabled={uploadedFiles.length === 0}
              >
                Submit for Review
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Submitting Step */}
        {step === 'submitting' && (
          <div className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Uploading screenshots and submitting quest...</p>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">Quest Submitted!</DialogTitle>
            </DialogHeader>
            
            <div className="py-8 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <div>
                <p className="font-medium">{quest.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your submission is pending admin verification
                </p>
              </div>
              <div className="flex justify-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <span className="font-bold text-primary">+{quest.xp_reward}</span> XP
                </span>
                <span className="flex items-center gap-1">
                  🍌 <span className="font-bold text-yellow-600">+{quest.banana_reward}</span>
                </span>
              </div>
            </div>

            <DialogFooter className="justify-center">
              <Button onClick={handleClose}>
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuestCompletionModal;
