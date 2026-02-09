import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Trophy, Medal, Crown, Check, Clock, X, Settings, Dices, Trash2 } from 'lucide-react';
import { Quest } from '@/hooks/useGamification';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type QuestType = 'daily' | 'weekly' | 'monthly';

interface QuestSlotCardProps {
  quest: Quest | undefined;
  questType: QuestType;
  status: 'pending' | 'verified' | 'rejected' | null;
  currentProgress?: number; // Number of uploads completed
  onViewQuest?: () => void;
  // Optional for daily quests
  hasRerolled?: boolean;
  isRerolling?: boolean;
  onReroll?: () => void;
  // Admin view hides Log Activity button
  isAdminView?: boolean;
  // Admin can remove assignments
  onRemoveAssignment?: () => void;
}

const questTypeConfig = {
  daily: {
    label: 'Daily Quest',
    badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: Trophy,
    iconColor: 'text-blue-400',
  },
  weekly: {
    label: 'Weekly Quest',
    badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: Medal,
    iconColor: 'text-purple-400',
  },
  monthly: {
    label: 'Special Ops',
    badgeClass: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    icon: Crown,
    iconColor: 'text-pink-400',
  },
};

const QuestSlotCard: React.FC<QuestSlotCardProps> = ({
  quest,
  questType,
  status,
  currentProgress = 0,
  onViewQuest,
  hasRerolled,
  isRerolling,
  onReroll,
  isAdminView = false,
  onRemoveAssignment,
}) => {
  const isVerified = status === 'verified';
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';

  // Use actual progress_target from quest
  const progressTarget = quest?.progress_target || 1;
  // Calculate actual progress percentage based on uploads
  const actualProgress = isVerified || isPending ? progressTarget : currentProgress;
  const progressValue = (actualProgress / progressTarget) * 100;

  const config = questTypeConfig[questType];
  const IconComponent = config.icon;

  return (
    <div
      className={`rounded-xl border-2 overflow-hidden transition-all ${
        isVerified
          ? 'border-green-500/50 bg-green-500/5'
          : isPending
          ? 'border-primary/50 bg-primary/5'
          : isRejected
          ? 'border-red-500/50 bg-red-500/5'
          : 'border-border/50 bg-card/50 hover:border-primary/50'
      }`}
    >
      {/* Header Row - Quest Type, XP, and Bananas */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-muted/20">
        <Badge 
          variant="outline" 
          className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 ${config.badgeClass}`}
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          <IconComponent className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
        <div className="flex items-center gap-3">
          {/* XP Reward */}
          <div className={`flex items-center gap-1 ${config.iconColor}`}>
            <span className="font-bold text-sm" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              ⭐ {quest?.xp_reward || 0} XP
            </span>
          </div>
          {/* Banana Reward */}
          <div className="flex items-center gap-1 text-primary">
            <span className="font-bold text-sm" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              🍌 {quest?.banana_reward || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2.5">
        {/* Game Name - Primary Title */}
        <div>
          <h3 
            className="text-lg font-bold text-foreground uppercase tracking-wide leading-tight"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            {quest?.game_name || quest?.title || 'Unknown Quest'}
          </h3>
          {quest?.game_name && quest.game_name !== quest.title && (
            <p className="text-sm text-muted-foreground italic mt-0.5">
              {quest.title}
            </p>
          )}
          {quest?.description && (
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
              {quest.description}
            </p>
          )}
        </div>

        {/* Progress Tracking */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span 
              className="text-muted-foreground uppercase tracking-wider font-medium"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              Progress
            </span>
            <span 
              className="text-primary font-bold"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              {actualProgress} / {progressTarget}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="relative">
            <Progress value={progressValue} className="h-3 bg-muted/30" />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        {(isVerified || isPending || isRejected) && (
          <div className="flex items-center gap-2">
            {isVerified && (
              <Badge className="bg-green-500 text-white text-xs">
                <Check className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
            {isPending && (
              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Pending Review
              </Badge>
            )}
            {isRejected && (
              <Badge variant="destructive" className="text-xs">
                <X className="h-3 w-3 mr-1" />
                Rejected
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-3 pb-3 flex items-center gap-2">
        {/* Log Activity Button - Only for user view, not admin - Stretched */}
        {!isVerified && !isAdminView && (
          <Button
            onClick={onViewQuest}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm h-9"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            <Settings className="h-4 w-4 mr-2" />
            Log Activity
          </Button>
        )}

        {/* Re-roll Button (All quest types, user view only) - Right side of button */}
        {onReroll && !isAdminView && (
          <Button
            size="icon"
            variant="outline"
            onClick={onReroll}
            disabled={Boolean(isRerolling) || Boolean(hasRerolled) || isPending || isVerified}
            title={
              hasRerolled
                ? 'Already re-rolled'
                : isPending
                  ? 'Pending review'
                  : isVerified
                    ? 'Quest completed'
                    : `Re-roll this quest (once per ${questType === 'daily' ? 'day' : questType === 'weekly' ? 'week' : 'month'})`
            }
            className="border-border/50 hover:border-primary hover:text-primary h-9 w-9 shrink-0"
          >
            {isRerolling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Dices className="h-4 w-4" />
            )}
          </Button>
        )}

        {hasRerolled && !isAdminView && !isVerified && (
          <Badge variant="outline" className="text-[10px] text-muted-foreground shrink-0">
            Re-rolled
          </Badge>
        )}

        {/* Admin View: Remove Assignment Button */}
        {isAdminView && onRemoveAssignment && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive border-destructive/50 hover:border-destructive h-9"
                title="Remove this quest assignment"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Assignment</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove this quest assignment? 
                  Users will no longer see this quest in their {questType} quests.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={onRemoveAssignment}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remove Assignment
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Awaiting Submission Badge - Only for admin view when not completed and no remove button */}
        {!isVerified && !isPending && isAdminView && !onRemoveAssignment && (
          <Badge variant="outline" className="text-xs text-muted-foreground border-border/50">
            <Clock className="h-3 w-3 mr-1" />
            Awaiting Submission
          </Badge>
        )}

        {isVerified && (
          <Button
            disabled
            className="flex-1 bg-green-500/20 text-green-500 font-bold text-sm h-9"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            <Check className="h-4 w-4 mr-2" />
            Completed
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuestSlotCard;
