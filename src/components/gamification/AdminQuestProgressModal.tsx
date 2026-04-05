import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AdminQuestProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  questName: string;
  questType: string;
  progressTarget: number;
  shift: string;
}

interface UserProgress {
  id: string;
  name: string;
  progressCount: number;
  status: 'not_started' | 'in_progress' | 'submitted' | 'completed';
  completionStatus?: string;
}

const AdminQuestProgressModal: React.FC<AdminQuestProgressModalProps> = ({
  open,
  onOpenChange,
  assignmentId,
  questName,
  questType,
  progressTarget,
  shift,
}) => {
  const [users, setUsers] = useState<UserProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !assignmentId) return;

    const fetchProgress = async () => {
      setIsLoading(true);

      // 1. Get all users in this shift/department
      // NULL department users are treated as 2PM
      let query = supabase
        .from('profiles')
        .select('id, name, department')
        .eq('status', 'Active');

      // For roles, we want Chatters — filter by role or roles containing 'Chatter'
      const { data: allProfiles } = await query;

      if (!allProfiles) {
        setIsLoading(false);
        return;
      }

      // Filter profiles by shift: department match, or NULL = 2PM
      const shiftProfiles = allProfiles.filter((p: any) => {
        const dept = p.department || '2PM';
        return dept === shift;
      });

      // Filter to only chatters (role = 'Chatter' or roles includes 'Chatter')
      // We need to fetch role info too
      const { data: profilesWithRoles } = await supabase
        .from('profiles')
        .select('id, name, department, role, roles')
        .eq('status', 'Active');

      const chatterProfiles = (profilesWithRoles || []).filter((p: any) => {
        const dept = p.department || '2PM';
        if (dept !== shift) return false;
        // Check if user is a chatter
        const isChatter = p.role === 'Chatter' || (p.roles && p.roles.includes('Chatter'));
        return isChatter;
      });

      if (chatterProfiles.length === 0) {
        setUsers([]);
        setIsLoading(false);
        return;
      }

      const chatterIds = chatterProfiles.map((p: any) => p.id);

      // 2. Fetch progress entries for this assignment from these users
      const { data: progressData } = await supabase
        .from('gamification_quest_progress')
        .select('chatter_id, slot_number')
        .eq('quest_assignment_id', assignmentId)
        .in('chatter_id', chatterIds);

      // 3. Fetch completions for this assignment from these users (include attachments for fallback count)
      const { data: completionsData } = await supabase
        .from('gamification_quest_completions')
        .select('chatter_id, status, attachments')
        .eq('quest_assignment_id', assignmentId)
        .in('chatter_id', chatterIds);

      // Build progress map from gamification_quest_progress
      const progressMap: Record<string, number> = {};
      (progressData || []).forEach((p: any) => {
        progressMap[p.chatter_id] = (progressMap[p.chatter_id] || 0) + 1;
      });

      const completionMap: Record<string, { status: string; attachmentCount: number }> = {};
      (completionsData || []).forEach((c: any) => {
        const attachmentCount = Array.isArray(c.attachments) ? c.attachments.filter((a: string) => a).length : 0;
        completionMap[c.chatter_id] = { status: c.status, attachmentCount };
      });

      // Build user progress list
      const userProgressList: UserProgress[] = chatterProfiles.map((p: any) => {
        let count = progressMap[p.id] || 0;
        const completion = completionMap[p.id];
        const completionStatus = completion?.status;

        // If submitted/completed but progress table shows 0, use attachments count or progressTarget as fallback
        if (completionStatus && (completionStatus === 'verified' || completionStatus === 'approved' || completionStatus === 'pending')) {
          if (count === 0) {
            // Use attachment count from completion, or fall back to progressTarget (submission requires meeting target)
            count = completion.attachmentCount > 0 ? completion.attachmentCount : progressTarget;
          }
        }

        let status: UserProgress['status'] = 'not_started';
        if (completionStatus === 'verified' || completionStatus === 'approved') {
          status = 'completed';
        } else if (completionStatus === 'pending') {
          status = 'submitted';
        } else if (count > 0) {
          status = 'in_progress';
        }

        return {
          id: p.id,
          name: p.name || 'Unknown',
          progressCount: count,
          status,
          completionStatus,
        };
      });

      // Sort: completed first, then submitted, then in_progress, then not_started
      const statusOrder = { completed: 0, submitted: 1, in_progress: 2, not_started: 3 };
      userProgressList.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

      setUsers(userProgressList);
      setIsLoading(false);
    };

    fetchProgress();
  }, [open, assignmentId, shift]);

  const getStatusBadge = (user: UserProgress) => {
    switch (user.status) {
      case 'completed':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </Badge>
        );
      case 'submitted':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 gap-1">
            <Clock className="h-3 w-3" />
            Submitted
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 gap-1">
            {user.progressCount}/{progressTarget}
          </Badge>
        );
      case 'not_started':
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1">
            <XCircle className="h-3 w-3" />
            Not started
          </Badge>
        );
    }
  };

  const completedCount = users.filter(u => u.status === 'completed').length;
  const submittedCount = users.filter(u => u.status === 'submitted').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold uppercase tracking-wide">
            {questName}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs uppercase">{questType}</Badge>
            <Badge variant="outline" className="text-xs">{shift} Shift</Badge>
            {!isLoading && (
              <span className="text-xs text-muted-foreground ml-auto">
                {completedCount}/{users.length} completed
                {submittedCount > 0 && ` · ${submittedCount} pending`}
              </span>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            No chatters found in the {shift} shift.
          </p>
        ) : (
          <div className="space-y-1 mt-2">
            {users.map(user => (
              <div
                key={user.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate">{user.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {user.progressCount}/{progressTarget}
                  </span>
                  {getStatusBadge(user)}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminQuestProgressModal;
