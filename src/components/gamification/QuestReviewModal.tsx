import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, ChevronLeft, ChevronRight, ZoomIn, User } from 'lucide-react';
import { format } from 'date-fns';

interface QuestCompletion {
  id: string;
  chatter_id: string;
  completed_at: string;
  xp_earned: number;
  bananas_earned: number;
  status: string;
  attachments?: string[];
  profile?: {
    name: string;
  };
  quest_assignment?: {
    quest?: {
      title: string;
      description?: string;
      xp_reward: number;
      banana_reward: number;
    };
  };
}

interface QuestReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completion: QuestCompletion | null;
  onApprove: (completionId: string) => void;
  onReject: (completionId: string) => void;
}

const QuestReviewModal: React.FC<QuestReviewModalProps> = ({
  open,
  onOpenChange,
  completion,
  onApprove,
  onReject
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!completion) return null;

  const attachments = completion.attachments || [];
  const quest = completion.quest_assignment?.quest;

  const handlePrevImage = () => {
    setSelectedImageIndex(prev => (prev > 0 ? prev - 1 : attachments.length - 1));
  };

  const handleNextImage = () => {
    setSelectedImageIndex(prev => (prev < attachments.length - 1 ? prev + 1 : 0));
  };

  const handleApprove = () => {
    onApprove(completion.id);
    onOpenChange(false);
  };

  const handleReject = () => {
    onReject(completion.id);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Quest Submission</DialogTitle>
            <DialogDescription>
              Review the screenshots and approve or reject this quest completion
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Chatter Info */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{completion.profile?.name || 'Unknown Chatter'}</p>
                <p className="text-sm text-muted-foreground">
                  Submitted {format(new Date(completion.completed_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>

            {/* Quest Info */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Quest</h4>
              <div className="p-3 border rounded-lg">
                <p className="font-medium">{quest?.title || 'Unknown Quest'}</p>
                {quest?.description && (
                  <p className="text-sm text-muted-foreground mt-1">{quest.description}</p>
                )}
                <div className="flex gap-3 mt-2">
                  <Badge variant="outline">+{completion.xp_earned} XP</Badge>
                  <Badge variant="outline" className="text-yellow-600">+{completion.bananas_earned} 🍌</Badge>
                </div>
              </div>
            </div>

            {/* Screenshot Gallery */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Screenshots ({attachments.length})
              </h4>
              
              {attachments.length > 0 ? (
                <div className="space-y-3">
                  {/* Main Image */}
                  <div className="relative bg-muted rounded-lg overflow-hidden">
                    <img
                      src={attachments[selectedImageIndex]}
                      alt={`Screenshot ${selectedImageIndex + 1}`}
                      className="w-full h-64 object-contain cursor-pointer"
                      onClick={() => setIsZoomed(true)}
                    />
                    
                    {attachments.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2 rounded-full shadow"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2 rounded-full shadow"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => setIsZoomed(true)}
                      className="absolute bottom-2 right-2 bg-background/80 hover:bg-background p-2 rounded-full shadow"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>

                    {attachments.length > 1 && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 px-2 py-1 rounded text-xs">
                        {selectedImageIndex + 1} / {attachments.length}
                      </div>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {attachments.length > 1 && (
                    <div className="flex gap-2 justify-center">
                      {attachments.map((url, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`w-16 h-12 rounded overflow-hidden border-2 transition-colors ${
                            index === selectedImageIndex 
                              ? 'border-primary' 
                              : 'border-transparent hover:border-primary/50'
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground bg-muted/50 rounded-lg">
                  No screenshots attached
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              <X className="h-4 w-4 mr-1" /> Reject
            </Button>
            <Button onClick={handleApprove}>
              <Check className="h-4 w-4 mr-1" /> Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zoomed Image Modal */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
          <div className="relative">
            <img
              src={attachments[selectedImageIndex]}
              alt={`Screenshot ${selectedImageIndex + 1}`}
              className="w-full h-auto max-h-[85vh] object-contain"
            />
            
            {attachments.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-3 rounded-full shadow"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-3 rounded-full shadow"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuestReviewModal;
