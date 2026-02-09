import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Check, X, Clock, Calendar, Star, Medal, Crown, Eye, Pencil, XCircle, Swords, Package, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useGamification, Quest, QuestAssignment } from '@/hooks/useGamification';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import QuestCompletionModal from './QuestCompletionModal';
import QuestReviewModal from './QuestReviewModal';
import DailyQuestSlots from './DailyQuestSlots';
import WeeklyQuestSlots from './WeeklyQuestSlots';
import MonthlyQuestSlots from './MonthlyQuestSlots';
import AdminDailyQuestSlots from './AdminDailyQuestSlots';
import AdminWeeklyQuestSlots from './AdminWeeklyQuestSlots';
import AdminMonthlyQuestSlots from './AdminMonthlyQuestSlots';

interface QuestsPanelProps {
  isAdmin: boolean;
}

const QuestsPanel: React.FC<QuestsPanelProps> = ({ isAdmin }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    quests,
    activeAssignments,
    myCompletions,
    shopItems,
    isLoading,
    submitQuestCompletion,
    verifyQuestCompletion,
    refetch
  } = useGamification();

  const [controlPanelTab, setControlPanelTab] = useState<'quests' | 'supply'>('quests');
  const [isCreating, setIsCreating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedQuestType, setSelectedQuestType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [newQuest, setNewQuest] = useState({
    title: '',
    description: '',
    quest_type: 'daily' as 'daily' | 'weekly' | 'monthly',
    xp_reward: 10,
    banana_reward: 5,
    progress_target: 1
  });
  const [selectedQuestForAssign, setSelectedQuestForAssign] = useState<string>('');
  
  const [pendingCompletions, setPendingCompletions] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<QuestAssignment | null>(null);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [selectedCompletionForReview, setSelectedCompletionForReview] = useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editGameName, setEditGameName] = useState('');
  const [editXpReward, setEditXpReward] = useState(0);
  const [editBananaReward, setEditBananaReward] = useState(0);
  const [editProgressTarget, setEditProgressTarget] = useState(1);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Shop item states
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    banana_cost: 100,
    stock: null as number | null
  });
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemDescription, setEditItemDescription] = useState('');
  const [editItemCost, setEditItemCost] = useState(0);
  const [editItemStock, setEditItemStock] = useState<number | null>(null);
  const [isSavingItem, setIsSavingItem] = useState(false);

  // Fetch pending completions for admin
  React.useEffect(() => {
    if (isAdmin) {
      fetchPendingCompletions();
    }
  }, [isAdmin]);

  const fetchPendingCompletions = async () => {
    const { data, error } = await supabase
      .from('gamification_quest_completions')
      .select(`
        *,
        profile:profiles!gamification_quest_completions_chatter_id_fkey (name),
        quest_assignment:gamification_quest_assignments (
          quest:gamification_quests (title, description, xp_reward, banana_reward)
        )
      `)
      .eq('status', 'pending')
      .order('completed_at', { ascending: false });

    if (!error) {
      setPendingCompletions((data as any) || []);
    }
  };

  const handleOpenQuestModal = (assignment: QuestAssignment) => {
    setSelectedAssignment(assignment);
    setIsCompletionModalOpen(true);
  };

  const handleQuestSubmitComplete = () => {
    refetch.myCompletions();
    if (isAdmin) {
      fetchPendingCompletions();
    }
  };

  const handleOpenReviewModal = (completion: any) => {
    setSelectedCompletionForReview(completion);
    setIsReviewModalOpen(true);
  };

  const handleCreateQuest = async () => {
    if (!newQuest.title.trim()) {
      toast({ title: "Error", description: "Quest title is required", variant: "destructive" });
      return;
    }

    try {
      setIsCreating(true);
      const { error } = await supabase
        .from('gamification_quests')
        .insert({
          ...newQuest,
          created_by: user?.id
        });

      if (error) throw error;

      toast({ title: "Success", description: "Quest created successfully!" });
      setNewQuest({ title: '', description: '', quest_type: 'daily', xp_reward: 10, banana_reward: 5, progress_target: 1 });
      refetch.quests();
    } catch (error) {
      console.error('Error creating quest:', error);
      toast({ title: "Error", description: "Failed to create quest", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleAssignQuest = async () => {
    if (!selectedQuestForAssign) {
      toast({ title: "Error", description: "Please select a quest", variant: "destructive" });
      return;
    }

    const quest = quests.find(q => q.id === selectedQuestForAssign);
    if (!quest) return;

    // Check assignment limits: max 4 daily, 1 weekly, 1 monthly
    const currentDailyCount = filterQuestsByType('daily').length;
    const currentWeeklyCount = filterQuestsByType('weekly').length;
    const currentMonthlyCount = filterQuestsByType('monthly').length;

    const limits = { daily: 4, weekly: 1, monthly: 1 };
    const currentCounts = { daily: currentDailyCount, weekly: currentWeeklyCount, monthly: currentMonthlyCount };

    if (currentCounts[quest.quest_type] >= limits[quest.quest_type]) {
      toast({ 
        title: "Assignment Limit Reached", 
        description: `You can only assign ${limits[quest.quest_type]} ${quest.quest_type} quest${limits[quest.quest_type] > 1 ? 's' : ''} at a time`,
        variant: "destructive" 
      });
      return;
    }

    let startDate: Date;
    let endDate: Date;
    const today = new Date();

    switch (quest.quest_type) {
      case 'daily':
        startDate = today;
        endDate = today;
        break;
      case 'weekly':
        startDate = startOfWeek(today, { weekStartsOn: 1 });
        endDate = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'monthly':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
    }

    try {
      setIsAssigning(true);
      // Admin assignments have assigned_by = null to distinguish from personal assignments
      // Personal assignments (from re-rolls) have assigned_by = user.id
      const { error } = await supabase
        .from('gamification_quest_assignments')
        .insert({
          quest_id: selectedQuestForAssign,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          assigned_by: null // NULL = admin/global assignment, visible to all players
        });

      if (error) throw error;

      toast({ title: "Success", description: "Quest assigned successfully!" });
      setSelectedQuestForAssign('');
      refetch.activeAssignments();
    } catch (error) {
      console.error('Error assigning quest:', error);
      toast({ title: "Error", description: "Failed to assign quest", variant: "destructive" });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleVerify = async (completionId: string, approve: boolean) => {
    const success = await verifyQuestCompletion(completionId, approve);
    if (success) {
      fetchPendingCompletions();
      refetch.leaderboard();
    }
  };

  const handleOpenEditDialog = (quest: Quest) => {
    setEditingQuest(quest);
    setEditDescription(quest.description || '');
    setEditGameName(quest.game_name || '');
    setEditXpReward(quest.xp_reward || 0);
    setEditBananaReward(quest.banana_reward || 0);
    setEditProgressTarget(quest.progress_target || 1);
  };

  const handleSaveQuest = async () => {
    if (!editingQuest) return;

    try {
      setIsSavingEdit(true);
      const { error } = await supabase
        .from('gamification_quests')
        .update({ 
          description: editDescription,
          game_name: editGameName || null,
          xp_reward: editXpReward,
          banana_reward: editBananaReward,
          progress_target: editProgressTarget
        })
        .eq('id', editingQuest.id);

      if (error) throw error;

      toast({ title: "Success", description: "Quest updated!" });
      setEditingQuest(null);
      refetch.quests();
    } catch (error) {
      console.error('Error updating quest:', error);
      toast({ title: "Error", description: "Failed to update quest", variant: "destructive" });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCloseAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('gamification_quest_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast({ title: "Success", description: "Quest assignment closed" });
      refetch.activeAssignments();
    } catch (error) {
      console.error('Error closing assignment:', error);
      toast({ title: "Error", description: "Failed to close assignment", variant: "destructive" });
    }
  };

  // Delete a quest definition (admin only)
  // This removes assignments, personal slots, and the quest itself
  const handleDeleteQuest = async (questId: string) => {
    try {
      // 1. Delete any assignments for this quest
      await supabase
        .from('gamification_quest_assignments')
        .delete()
        .eq('quest_id', questId);

      // 2. Delete all personal slots for this quest (for ALL users)
      await supabase
        .from('gamification_daily_quest_slots')
        .delete()
        .eq('quest_id', questId);

      // 3. Delete the quest itself
      const { error } = await supabase
        .from('gamification_quests')
        .delete()
        .eq('id', questId);

      if (error) throw error;

      toast({ title: "Success", description: "Quest deleted successfully" });
      refetch.quests();
      refetch.activeAssignments();
    } catch (error) {
      console.error('Error deleting quest:', error);
      toast({ title: "Error", description: "Failed to delete quest", variant: "destructive" });
    }
  };

  // Remove a quest assignment by quest_id (admin only)
  // This removes the global assignment AND all personal slots for this quest
  const handleRemoveAssignmentByQuestId = async (questId: string) => {
    try {
      // 1. Delete the global assignment
      const { error: assignmentError } = await supabase
        .from('gamification_quest_assignments')
        .delete()
        .eq('quest_id', questId);

      if (assignmentError) throw assignmentError;

      // 2. Delete all personal slots for this quest (for ALL users)
      // This ensures the quest is removed from everyone's Quests page
      const { error: slotsError } = await supabase
        .from('gamification_daily_quest_slots')
        .delete()
        .eq('quest_id', questId);

      if (slotsError) {
        console.error('Error removing personal slots:', slotsError);
        // Don't throw - assignment was already removed
      }

      toast({ title: "Success", description: "Quest assignment removed from all users" });
      refetch.activeAssignments();
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({ title: "Error", description: "Failed to remove assignment", variant: "destructive" });
    }
  };

  // Shop Item handlers
  const handleCreateItem = async () => {
    if (!newItem.name.trim()) {
      toast({ title: "Error", description: "Item name is required", variant: "destructive" });
      return;
    }

    try {
      setIsCreatingItem(true);
      const { error } = await supabase
        .from('gamification_shop_items')
        .insert({
          ...newItem,
          created_by: user?.id
        });

      if (error) throw error;

      toast({ title: "Success", description: "Shop item created successfully!" });
      setNewItem({ name: '', description: '', banana_cost: 100, stock: null });
      refetch.shopItems();
    } catch (error) {
      console.error('Error creating item:', error);
      toast({ title: "Error", description: "Failed to create shop item", variant: "destructive" });
    } finally {
      setIsCreatingItem(false);
    }
  };

  const handleOpenEditItemDialog = (item: any) => {
    setEditingItem(item);
    setEditItemName(item.name || '');
    setEditItemDescription(item.description || '');
    setEditItemCost(item.banana_cost || 0);
    setEditItemStock(item.stock);
  };

  const handleSaveItem = async () => {
    if (!editingItem) return;

    try {
      setIsSavingItem(true);
      const { error } = await supabase
        .from('gamification_shop_items')
        .update({ 
          name: editItemName,
          description: editItemDescription,
          banana_cost: editItemCost,
          stock: editItemStock
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      toast({ title: "Success", description: "Shop item updated!" });
      setEditingItem(null);
      refetch.shopItems();
    } catch (error) {
      console.error('Error updating item:', error);
      toast({ title: "Error", description: "Failed to update shop item", variant: "destructive" });
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleToggleItemActive = async (item: any) => {
    await supabase
      .from('gamification_shop_items')
      .update({ is_active: !item.is_active })
      .eq('id', item.id);
    refetch.shopItems();
  };

  const getCompletionStatus = (assignmentId: string) => {
    return myCompletions.find(c => c.quest_assignment_id === assignmentId);
  };

  const filterQuestsByType = (type: 'daily' | 'weekly' | 'monthly') => {
    return activeAssignments.filter(a => a.quest?.quest_type === type);
  };

  const getQuestIcon = (type: string) => {
    switch (type) {
      case 'daily': return <Star className="h-4 w-4 text-yellow-500" />;
      case 'weekly': return <Medal className="h-4 w-4 text-blue-500" />;
      case 'monthly': return <Crown className="h-4 w-4 text-purple-500" />;
      default: return <Star className="h-4 w-4" />;
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
    <div className="space-y-6">
      {/* Page Header - Admin Control Panel uses standard CRM fonts */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Control Panel</h1>
          <p className="text-muted-foreground mt-1">Manage quests, shop items, and review submissions</p>
        </div>
      </div>

      {/* Main Tabs for Quest Management vs Supply Management */}
      <Tabs value={controlPanelTab} onValueChange={(v) => setControlPanelTab(v as 'quests' | 'supply')} className="w-full">
        <TabsList className="w-auto justify-start">
          <TabsTrigger value="quests" className="flex items-center gap-2">
            <Swords className="h-4 w-4" />
            Quest Management
          </TabsTrigger>
          <TabsTrigger value="supply" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Supply Management
          </TabsTrigger>
        </TabsList>

        {/* Quest Management Tab */}
        <TabsContent value="quests" className="mt-6 space-y-6">
          {/* Admin Controls */}
          {isAdmin && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-xl">Quest Management</CardTitle>
                <CardDescription className="text-base">Create and manage quests for chatters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  {/* Create Quest Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Quest
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Quest</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input 
                            value={newQuest.title}
                            onChange={e => setNewQuest({ ...newQuest, title: e.target.value })}
                            placeholder="e.g., Sell 5 customs today"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea 
                            value={newQuest.description}
                            onChange={e => setNewQuest({ ...newQuest, description: e.target.value })}
                            placeholder="Describe what needs to be done..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Quest Type</Label>
                          <Select 
                            value={newQuest.quest_type}
                            onValueChange={(v: 'daily' | 'weekly' | 'monthly') => setNewQuest({ ...newQuest, quest_type: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>XP Reward</Label>
                            <Input 
                              type="number"
                              value={newQuest.xp_reward}
                              onChange={e => setNewQuest({ ...newQuest, xp_reward: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Banana Reward 🍌</Label>
                            <Input 
                              type="number"
                              value={newQuest.banana_reward}
                              onChange={e => setNewQuest({ ...newQuest, banana_reward: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Progress Target</Label>
                            <Input 
                              type="number"
                              value={newQuest.progress_target}
                              onChange={e => setNewQuest({ ...newQuest, progress_target: parseInt(e.target.value) || 1 })}
                              min={1}
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleCreateQuest} disabled={isCreating}>
                          {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Create Quest
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Assign Quest Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Calendar className="h-4 w-4 mr-2" />
                        Assign Quest
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Assign Quest for Current Period</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Select Quest</Label>
                          <Select 
                            value={selectedQuestForAssign}
                            onValueChange={setSelectedQuestForAssign}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a quest..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 overflow-y-auto">
                              {quests.filter(q => q.is_active).map(quest => (
                                <SelectItem key={quest.id} value={quest.id}>
                                  <div className="flex items-center gap-2">
                                    {getQuestIcon(quest.quest_type)}
                                    <span>{quest.title}</span>
                                    <Badge variant="outline" className="ml-2">
                                      {quest.quest_type}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedQuestForAssign && (
                          <div className="text-sm text-muted-foreground">
                            The quest will be assigned based on its type:
                            <ul className="list-disc list-inside mt-1">
                              <li>Daily: Today only</li>
                              <li>Weekly: Current week (Mon-Sun)</li>
                              <li>Monthly: Current month</li>
                            </ul>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAssignQuest} disabled={isAssigning || !selectedQuestForAssign}>
                          {isAssigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Assign Quest
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Pending Verifications */}
                {pendingCompletions.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      Pending Verifications ({pendingCompletions.length})
                    </h3>
                    <div className="space-y-2">
                      {pendingCompletions.map(completion => (
                        <Card key={completion.id} className="bg-yellow-500/10 border-yellow-500/30">
                          <CardContent className="py-3 flex items-center justify-between">
                            <div>
                              <p className="font-medium">{completion.profile?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {completion.quest_assignment?.quest?.title}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleOpenReviewModal(completion)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quest Category Sub-tabs */}
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="w-auto justify-start mb-4">
              <TabsTrigger value="daily" className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                Daily Quests
              </TabsTrigger>
              <TabsTrigger value="weekly" className="flex items-center gap-2">
                <Medal className="h-4 w-4 text-blue-500" />
                Weekly Quests
              </TabsTrigger>
              <TabsTrigger value="monthly" className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-500" />
                Monthly Quests
              </TabsTrigger>
            </TabsList>

            <TabsContent value="daily">
              {isAdmin ? (
                <AdminDailyQuestSlots 
                  onRemoveAssignment={handleRemoveAssignmentByQuestId}
                />
              ) : (
                <DailyQuestSlots 
                  onQuestComplete={handleQuestSubmitComplete} 
                />
              )}
            </TabsContent>
            <TabsContent value="weekly">
              {isAdmin ? (
                <AdminWeeklyQuestSlots 
                  onRemoveAssignment={handleRemoveAssignmentByQuestId}
                />
              ) : (
                <WeeklyQuestSlots 
                  onQuestComplete={handleQuestSubmitComplete} 
                />
              )}
            </TabsContent>
            <TabsContent value="monthly">
              {isAdmin ? (
                <AdminMonthlyQuestSlots 
                  onRemoveAssignment={handleRemoveAssignmentByQuestId}
                />
              ) : (
                <MonthlyQuestSlots 
                  onQuestComplete={handleQuestSubmitComplete} 
                />
              )}
            </TabsContent>
          </Tabs>

          {/* All Quests Table for Admin */}
          {isAdmin && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>All Quests</CardTitle>
                <CardDescription>View and manage all created quests</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>XP</TableHead>
                      <TableHead>Bananas</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quests.map(quest => (
                      <TableRow key={quest.id}>
                        <TableCell className="font-medium">
                          {quest.game_name || quest.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{quest.quest_type}</Badge>
                        </TableCell>
                        <TableCell>{quest.xp_reward}</TableCell>
                        <TableCell>{quest.banana_reward} 🍌</TableCell>
                        <TableCell>{quest.progress_target}</TableCell>
                        <TableCell>
                          <Badge variant={quest.is_active ? 'default' : 'secondary'}>
                            {quest.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleOpenEditDialog(quest)}
                              title="Edit quest"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  title="Delete quest"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Quest</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{quest.game_name || quest.title}"? 
                                    This will also remove all active assignments for this quest. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteQuest(quest.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete Quest
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Supply Management Tab */}
        <TabsContent value="supply" className="mt-6 space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-xl">Supply Management</CardTitle>
              <CardDescription className="text-base">Create and manage shop items for chatters to purchase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Create Item Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Shop Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Shop Item</DialogTitle>
                    <DialogDescription>
                      Add a new perk or reward that chatters can purchase with bananas.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Item Name</Label>
                      <Input 
                        value={newItem.name}
                        onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                        placeholder="e.g., Extra Day Off"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea 
                        value={newItem.description}
                        onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                        placeholder="Describe the perk or reward..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Banana Cost 🍌</Label>
                        <Input 
                          type="number"
                          value={newItem.banana_cost}
                          onChange={e => setNewItem({ ...newItem, banana_cost: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Stock (leave empty for unlimited)</Label>
                        <Input 
                          type="number"
                          value={newItem.stock ?? ''}
                          onChange={e => setNewItem({ ...newItem, stock: e.target.value ? parseInt(e.target.value) : null })}
                          placeholder="Unlimited"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateItem} disabled={isCreatingItem}>
                      {isCreatingItem && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Item
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Manage Shop Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Shop Items</CardTitle>
              <CardDescription>All shop items available for purchase</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shopItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                      <TableCell>{item.banana_cost} 🍌</TableCell>
                      <TableCell>{item.stock ?? '∞'}</TableCell>
                      <TableCell>
                        <Badge variant={item.is_active ? 'default' : 'secondary'}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleOpenEditItemDialog(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleToggleItemActive(item)}
                          >
                            {item.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {shopItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No shop items created yet. Add your first item above.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Quest Dialog */}
      <Dialog open={!!editingQuest} onOpenChange={() => setEditingQuest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Quest: {editingQuest?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Game Name (Display Name)</Label>
              <Input 
                value={editGameName}
                onChange={e => setEditGameName(e.target.value)}
                placeholder="e.g., CUSTOM CRUSADER"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                placeholder="Quest description..."
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>XP Reward</Label>
                <Input 
                  type="number"
                  value={editXpReward}
                  onChange={e => setEditXpReward(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Banana Reward 🍌</Label>
                <Input 
                  type="number"
                  value={editBananaReward}
                  onChange={e => setEditBananaReward(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Progress Target</Label>
                <Input 
                  type="number"
                  value={editProgressTarget}
                  onChange={e => setEditProgressTarget(parseInt(e.target.value) || 1)}
                  min={1}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingQuest(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuest} disabled={isSavingEdit}>
              {isSavingEdit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Shop Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shop Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input 
                value={editItemName}
                onChange={e => setEditItemName(e.target.value)}
                placeholder="e.g., Extra Day Off"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={editItemDescription}
                onChange={e => setEditItemDescription(e.target.value)}
                placeholder="Describe the perk or reward..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Banana Cost 🍌</Label>
                <Input 
                  type="number"
                  value={editItemCost}
                  onChange={e => setEditItemCost(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Stock (leave empty for unlimited)</Label>
                <Input 
                  type="number"
                  value={editItemStock ?? ''}
                  onChange={e => setEditItemStock(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Unlimited"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveItem} disabled={isSavingItem}>
              {isSavingItem && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quest Completion Modal */}
      {selectedAssignment && (
        <QuestCompletionModal
          open={isCompletionModalOpen}
          onOpenChange={(open) => {
            setIsCompletionModalOpen(open);
            if (!open) setSelectedAssignment(null);
          }}
          assignment={selectedAssignment}
          onSubmitComplete={handleQuestSubmitComplete}
        />
      )}

      {/* Quest Review Modal */}
      {selectedCompletionForReview && (
        <QuestReviewModal
          open={isReviewModalOpen}
          onOpenChange={(open) => {
            setIsReviewModalOpen(open);
            if (!open) setSelectedCompletionForReview(null);
          }}
          completion={selectedCompletionForReview}
          onApprove={(completionId) => handleVerify(completionId, true)}
          onReject={(completionId) => handleVerify(completionId, false)}
        />
      )}
    </div>
  );
};

export default QuestsPanel;
