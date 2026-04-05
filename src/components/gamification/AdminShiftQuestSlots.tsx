import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Plus, Clock, Check, X, Trash2, Eye } from 'lucide-react';
import { useAdminShiftQuests, SHIFT_DEPARTMENTS } from '@/hooks/useShiftQuests';
import { useGamification } from '@/hooks/useGamification';

const AdminShiftQuestSlots: React.FC = () => {
  const { quests } = useGamification();
  const {
    assignments,
    completions,
    isLoading,
    isAssigning,
    today,
    assignQuestToShifts,
    removeAssignment,
    verifyCompletion,
  } = useAdminShiftQuests();

  const [selectedQuestId, setSelectedQuestId] = useState('');

  // Get shift quests from the quest pool (quest_type = 'shift')
  const shiftQuests = quests.filter(q => q.quest_type === 'shift' && q.is_active);
  // Also allow assigning daily quests as shift quests
  const assignableQuests = quests.filter(q => q.is_active);

  const handleAssign = async () => {
    if (!selectedQuestId) return;
    const success = await assignQuestToShifts(selectedQuestId);
    if (success) setSelectedQuestId('');
  };

  // Group assignments by quest
  const questGroups = assignments.reduce<Record<string, typeof assignments>>((acc, a) => {
    if (!acc[a.quest_id]) acc[a.quest_id] = [];
    acc[a.quest_id].push(a);
    return acc;
  }, {});

  const getCompletionsForAssignment = (assignmentId: string) => {
    return completions.filter(c => c.shift_assignment_id === assignmentId);
  };

  const pendingCompletions = completions.filter(c => c.status === 'pending');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Assign Shift Quest */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Shift Quests — {today}</CardTitle>
          <CardDescription>
            Assign a quest to all 3 shifts (6AM, 2PM, 10PM) for today. Players see quests matching their Department.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <Select value={selectedQuestId} onValueChange={setSelectedQuestId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a quest to assign..." />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {assignableQuests.map(quest => (
                    <SelectItem key={quest.id} value={quest.id}>
                      <div className="flex items-center gap-2">
                        <span>{quest.game_name || quest.title}</span>
                        <Badge variant="outline" className="ml-1 text-xs">{quest.quest_type}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAssign} disabled={isAssigning || !selectedQuestId}>
              {isAssigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Plus className="h-4 w-4 mr-2" />
              Assign to All Shifts
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Verifications */}
      {pendingCompletions.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Pending Shift Submissions ({pendingCompletions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Quest</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingCompletions.map(completion => {
                  const assignment = assignments.find(a => a.id === completion.shift_assignment_id);
                  return (
                    <TableRow key={completion.id}>
                      <TableCell className="font-medium">{completion.profile?.name || 'Unknown'}</TableCell>
                      <TableCell>{assignment?.quest?.game_name || assignment?.quest?.title || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{assignment?.shift}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(completion.submitted_at).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-500/30"
                            onClick={() => verifyCompletion(completion.id, true)}
                          >
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/30"
                            onClick={() => verifyCompletion(completion.id, false)}
                          >
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today's Shift Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(questGroups).length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No shift quests assigned for today.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quest</TableHead>
                  <TableHead>Shifts</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(questGroups).map(([questId, shiftAssignments]) => {
                  const quest = shiftAssignments[0]?.quest;
                  const totalCompletions = shiftAssignments.reduce(
                    (sum, a) => sum + getCompletionsForAssignment(a.id).length,
                    0
                  );
                  const verifiedCount = shiftAssignments.reduce(
                    (sum, a) => sum + getCompletionsForAssignment(a.id).filter(c => c.status === 'verified').length,
                    0
                  );

                  return (
                    <TableRow key={questId}>
                      <TableCell className="font-medium">{quest?.game_name || quest?.title || '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {shiftAssignments.map(a => (
                            <Badge key={a.id} variant="outline" className="text-xs">{a.shift}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{verifiedCount} verified / {totalCompletions} total</span>
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Shift Quest</AlertDialogTitle>
                              <AlertDialogDescription>
                                Remove "{quest?.game_name || quest?.title}" from all shifts today? Existing submissions will be deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removeAssignment(questId)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminShiftQuestSlots;
