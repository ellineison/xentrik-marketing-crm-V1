import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Medal, Crown, Star, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { Quest, QuestAssignment } from '@/hooks/useGamification';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import QuestEvidenceUpload from './QuestEvidenceUpload';
import { useWordOfTheDay } from '@/hooks/useWordOfTheDay';

interface QuestDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: QuestAssignment;
  completionStatus: 'pending' | 'verified' | 'rejected' | null;
  onSubmitComplete: () => void;
}

const questTypeConfig = {
  daily: {
    label: 'Daily Quest',
    badgeClass: 'bg-green-500/20 text-green-400 border-green-500/50',
    icon: Trophy,
    iconColor: 'text-yellow-500',
    bgGradient: 'from-green-500/10 to-emerald-500/10',
  },
  weekly: {
    label: 'Weekly Quest',
    badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    icon: Medal,
    iconColor: 'text-purple-500',
    bgGradient: 'from-purple-500/10 to-pink-500/10',
  },
  monthly: {
    label: 'Special Ops',
    badgeClass: 'bg-pink-500/20 text-pink-400 border-pink-500/50',
    icon: Crown,
    iconColor: 'text-pink-500',
    bgGradient: 'from-pink-500/10 to-orange-500/10',
  },
};

const QuestDetailsModal: React.FC<QuestDetailsModalProps> = ({
  open,
  onOpenChange,
  assignment,
  completionStatus,
  onSubmitComplete,
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'details' | 'upload'>('details');
  const [currentProgress, setCurrentProgress] = useState(0);
  const { dailyWord, isLoading: wordLoading } = useWordOfTheDay();
  
  const quest = assignment.quest;
  
  // Check if this is an Ability Rotation quest
  const isAbilityRotation = quest?.game_name?.toLowerCase().includes('ability rotation') || 
                            quest?.title?.toLowerCase().includes('ability rotation');
  
  // Fetch current progress when modal opens
  useEffect(() => {
    const fetchProgress = async () => {
      if (!user || !open || !assignment) return;
      
      const { data, error } = await supabase
        .from('gamification_quest_progress')
        .select('*')
        .eq('quest_assignment_id', assignment.id)
        .eq('chatter_id', user.id);
      
      if (!error && data) {
        setCurrentProgress(data.length);
      }
    };
    
    fetchProgress();
  }, [user, open, assignment]);
  
  if (!quest) return null;
  
  const questType = quest.quest_type || 'daily';
  const config = questTypeConfig[questType];
  const IconComponent = config.icon;
  
  const isCompleted = completionStatus === 'verified';
  const isPending = completionStatus === 'pending';
  
  const handleClose = () => {
    setStep('details');
    onOpenChange(false);
  };

  const handleContinue = () => {
    setStep('upload');
  };

  const handleBack = () => {
    setStep('details');
  };

  const handleSubmitComplete = () => {
    onSubmitComplete();
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-2 border-primary/30">
        {step === 'details' ? (
          // Step 1: Quest Details (Like a game level intro)
          <div className="flex flex-col" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            {/* Header with gradient background */}
            <div className={`relative bg-gradient-to-br ${config.bgGradient} p-6 pb-8`}>
              {/* Quest type badge */}
              <Badge 
                variant="outline" 
                className={`text-xs font-bold tracking-wider uppercase ${config.badgeClass} mb-4`}
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                <IconComponent className={`h-3 w-3 mr-1 ${config.iconColor}`} />
                {config.label}
              </Badge>
              
              {/* Quest Title */}
              <h2 
                className="text-2xl font-bold text-foreground uppercase tracking-wide leading-tight"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                {quest.game_name || quest.title}
              </h2>
              
              {quest.game_name && quest.game_name !== quest.title && (
                <p className="text-sm text-muted-foreground italic mt-1">
                  {quest.title}
                </p>
              )}
            </div>
            
            {/* Quest Content */}
            <div className="p-6 space-y-5">
              {/* Mission Briefing */}
              <div className="space-y-2">
                <h3 
                  className="text-sm font-bold text-muted-foreground uppercase tracking-wider"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  Mission Briefing
                </h3>
                <p className="text-base text-foreground leading-relaxed">
                  {quest.description || 'Complete this quest to earn rewards.'}
                </p>
                
                {/* Word of the Day - Only for Ability Rotation quests */}
                {isAbilityRotation && dailyWord && !wordLoading && (
                  <div className="mt-4 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-purple-400" />
                      <span className="text-sm font-medium text-purple-400 uppercase tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                        Today's Word
                      </span>
                      <Sparkles className="h-3 w-3 text-yellow-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-purple-300" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                        {dailyWord.word}
                      </span>
                      {dailyWord.part_of_speech && (
                        <Badge variant="outline" className="text-xs text-purple-300 border-purple-300/50">
                          {dailyWord.part_of_speech}
                        </Badge>
                      )}
                    </div>
                    {dailyWord.definition && (
                      <p className="text-sm text-muted-foreground italic mt-1">
                        "{dailyWord.definition}"
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Rewards Section */}
              <div className="space-y-2">
                <h3 
                  className="text-sm font-bold text-muted-foreground uppercase tracking-wider"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  Rewards
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-4 py-2">
                    <Star className="h-5 w-5 text-primary" />
                    <span 
                      className="text-xl font-bold text-primary"
                      style={{ fontFamily: "'Orbitron', sans-serif" }}
                    >
                      +{quest.xp_reward} XP
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-yellow-500/10 rounded-lg px-4 py-2">
                    <span className="text-xl">🍌</span>
                    <span 
                      className="text-xl font-bold text-yellow-500"
                      style={{ fontFamily: "'Orbitron', sans-serif" }}
                    >
                      +{quest.banana_reward}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span 
                    className="text-muted-foreground uppercase tracking-wider font-medium"
                    style={{ fontFamily: "'Orbitron', sans-serif" }}
                  >
                    Screenshots Required
                  </span>
                  <span 
                    className="font-bold text-primary"
                    style={{ fontFamily: "'Orbitron', sans-serif" }}
                  >
                    {isCompleted || isPending ? `${quest.progress_target || 1} / ${quest.progress_target || 1}` : `${currentProgress} / ${quest.progress_target || 1}`}
                  </span>
                </div>
                <Progress 
                  value={isCompleted || isPending ? 100 : (currentProgress / (quest.progress_target || 1)) * 100} 
                  className="h-3" 
                />
              </div>
              
              {/* Status */}
              {(isCompleted || isPending) && (
                <div className="pt-2">
                  {isCompleted && (
                    <Badge className="bg-green-500 text-white">
                      ✓ Quest Completed
                    </Badge>
                  )}
                  {isPending && (
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                      ⏳ Pending Admin Review
                    </Badge>
                  )}
                </div>
              )}
            </div>
            
            {/* Footer Actions */}
            <div className="px-6 pb-6 flex items-center justify-between gap-3">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              
              {!isCompleted && !isPending && (
                <Button 
                  onClick={handleContinue}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          // Step 2: Evidence Upload
          <QuestEvidenceUpload
            assignment={assignment}
            onBack={handleBack}
            onSubmitComplete={handleSubmitComplete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuestDetailsModal;
