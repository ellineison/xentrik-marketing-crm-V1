import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, CheckCircle, XCircle, Upload } from 'lucide-react';
import { useShiftQuests, ShiftQuestAssignment } from '@/hooks/useShiftQuests';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import QuestDetailsModal from './QuestDetailsModal';
import { QuestAssignment } from '@/hooks/useGamification';

interface ShiftCompletionStatus {
  assignmentId: string;
  status: 'pending' | 'verified' | 'rejected' | null;
}

const ShiftQuestSlots: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { assignments, myShift, isLoading, today, refetch } = useShiftQuests();
  const [completionStatuses, setCompletionStatuses] = useState<ShiftCompletionStatus[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  // Fetch completion statuses for displayed shift quests
  const fetchStatuses = useCallback(async () => {
    if (!user || assignments.length === 0) {
      setCompletionStatuses([]);
      return;
    }

    const assignmentIds = assignments.map(a => a.id);
    const { data } = await supabase
      .from('gamification_shift_quest_completions')
      .select('shift_assignment_id, status')
      .eq('chatter_id', user.id)
      .in('shift_assignment_id', assignmentIds);

    const statuses: ShiftCompletionStatus[] = assignmentIds.map(id => {
      const completion = data?.find(c => c.shift_assignment_id === id);
      return {
        assignmentId: id,
        status: (completion?.status as ShiftCompletionStatus['status']) ?? null,
      };
    });
    setCompletionStatuses(statuses);
  }, [user, assignments]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const getStatus = (assignmentId: string) => {
    return completionStatuses.find(s => s.assignmentId === assignmentId)?.status ?? null;
  };

  const handleSubmit = async (assignment: ShiftQuestAssignment) => {
    if (!user) return;

    setIsSubmitting(assignment.id);
    try {
      // Insert completion
      const { error: completionError } = await supabase
        .from('gamification_shift_quest_completions')
        .insert({
          shift_assignment_id: assignment.id,
          chatter_id: user.id,
          status: 'pending',
        });

      if (completionError) {
        if (completionError.code === '23505') {
          toast({ title: 'Already Submitted', description: 'You already submitted this quest.', variant: 'destructive' });
        } else {
          throw completionError;
        }
        return;
      }

      // Send notification to admins
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      const playerName = profile?.name || user.email || 'A player';

      // Get admin IDs
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .or("role.eq.Admin,roles.cs.{Admin}");

      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          recipient_id: admin.id,
          title: 'Shift Quest Submission',
          message: `${playerName} submitted "${assignment.quest?.game_name || assignment.quest?.title}" for the ${assignment.shift} shift.`,
          type: 'shift_quest_submission',
          related_id: assignment.id,
        }));

        await supabase.from('notifications').insert(notifications);
      }

      toast({ title: 'Submitted!', description: 'Your shift quest has been submitted for review.' });
      fetchStatuses();
    } catch (error) {
      console.error('Error submitting shift quest:', error);
      toast({ title: 'Error', description: 'Failed to submit shift quest', variant: 'destructive' });
    } finally {
      setIsSubmitting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!myShift) {
    return null; // User not in a shift department, don't show anything
  }

  if (assignments.length === 0) {
    return (
      <Card className="bg-card/80 border-border/50">
        <CardContent className="p-8 text-center">
          <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            No shift quests for your {myShift} shift today.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-bold flex items-center gap-2 uppercase tracking-wide"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          <Clock className="h-5 w-5 text-primary" />
          Shift Quests — {myShift}
        </h2>
        <Badge
          variant="outline"
          className="text-base px-3 py-1 border-primary/30 font-bold"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          {completionStatuses.filter(s => s.status === 'verified').length}/{assignments.length}
        </Badge>
      </div>

      <div className="grid gap-3">
        {assignments.map(assignment => {
          const status = getStatus(assignment.id);
          const quest = assignment.quest;

          return (
            <Card
              key={assignment.id}
              className={`border transition-all ${
                status === 'verified'
                  ? 'border-green-500/40 bg-green-500/5'
                  : status === 'pending'
                    ? 'border-yellow-500/40 bg-yellow-500/5'
                    : status === 'rejected'
                      ? 'border-red-500/40 bg-red-500/5'
                      : 'border-border/50 bg-card/80'
              }`}
            >
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-bold text-foreground truncate"
                    style={{ fontFamily: "'Orbitron', sans-serif" }}
                  >
                    {quest?.game_name || quest?.title || 'Unknown Quest'}
                  </h3>
                  {quest?.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {quest.description}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{quest?.xp_reward} XP</Badge>
                    <Badge variant="outline" className="text-xs">{quest?.banana_reward} 🍌</Badge>
                  </div>
                </div>

                <div className="shrink-0">
                  {status === 'verified' && (
                    <Badge className="bg-green-600 text-white">
                      <CheckCircle className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  )}
                  {status === 'pending' && (
                    <Badge className="bg-yellow-600 text-white">
                      <Clock className="h-3 w-3 mr-1" /> Pending
                    </Badge>
                  )}
                  {status === 'rejected' && (
                    <div className="flex flex-col gap-1 items-end">
                      <Badge className="bg-red-600 text-white">
                        <XCircle className="h-3 w-3 mr-1" /> Rejected
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSubmit(assignment)}
                        disabled={isSubmitting === assignment.id}
                      >
                        {isSubmitting === assignment.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>Resubmit</>
                        )}
                      </Button>
                    </div>
                  )}
                  {status === null && (
                    <Button
                      onClick={() => handleSubmit(assignment)}
                      disabled={isSubmitting === assignment.id}
                      className="bg-primary text-primary-foreground"
                    >
                      {isSubmitting === assignment.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Submit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ShiftQuestSlots;
