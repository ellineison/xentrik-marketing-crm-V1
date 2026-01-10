
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PremiumCard } from '@/components/ui/premium-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Download } from 'lucide-react';
import KanbanBoard from '@/components/customs/KanbanBoard';
import CreateCustomModal from '@/components/customs/CreateCustomModal';
import EndorsedExportModal from '@/components/customs/EndorsedExportModal';
import { useToast } from '@/hooks/use-toast';
import { Custom } from '@/types/custom';

const CustomsTracker = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [modelFilter, setModelFilter] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch customs data
  const { data: customs = [], isLoading, error } = useQuery({
    queryKey: ['customs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Custom[];
    }
  });

  // Update custom status mutation
  const updateCustomMutation = useMutation({
    mutationFn: async ({ customId, newStatus, chatterName, endorserName }: { 
      customId: string; 
      newStatus: string; 
      chatterName?: string; 
      endorserName?: string; 
    }) => {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (chatterName) {
        updateData.sent_by = chatterName;
      }

      if (endorserName) {
        updateData.endorsed_by = endorserName;
      }

      const { error } = await supabase
        .from('customs')
        .update(updateData)
        .eq('id', customId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customs'] });
      toast({
        title: "Success",
        description: "Custom status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update custom status",
        variant: "destructive",
      });
      console.error('Error updating custom:', error);
    }
  });

  // Update custom downpayment mutation
  const updateDownpaymentMutation = useMutation({
    mutationFn: async ({ customId, newDownpayment }: { customId: string; newDownpayment: number }) => {
      const { error } = await supabase
        .from('customs')
        .update({ 
          downpayment: newDownpayment,
          updated_at: new Date().toISOString()
        })
        .eq('id', customId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customs'] });
      toast({
        title: "Success",
        description: "Downpayment updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update downpayment",
        variant: "destructive",
      });
      console.error('Error updating downpayment:', error);
    }
  });

  // Delete custom mutation
  const deleteCustomMutation = useMutation({
    mutationFn: async (customId: string) => {
      const { error } = await supabase
        .from('customs')
        .delete()
        .eq('id', customId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customs'] });
      toast({
        title: "Success",
        description: "Custom deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete custom",
        variant: "destructive",
      });
      console.error('Error deleting custom:', error);
    }
  });

  // Filter customs by model name
  const filteredCustoms = customs.filter(custom =>
    modelFilter === '' || custom.model_name.toLowerCase().includes(modelFilter.toLowerCase())
  );

  const handleUpdateDownpayment = (customId: string, newDownpayment: number) => {
    updateDownpaymentMutation.mutate({ customId, newDownpayment });
  };

  const handleDeleteCustom = (customId: string) => {
    deleteCustomMutation.mutate(customId);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading customs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading customs</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['customs'] })}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customs Tracker</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsExportModalOpen(true)} 
            variant="outline" 
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export Endorsed
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Custom
          </Button>
        </div>
      </div>

      {/* Filter */}
      <PremiumCard className="p-3">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by model name..."
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredCustoms.length} of {customs.length} customs
          </div>
        </div>
      </PremiumCard>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard 
          customs={filteredCustoms} 
          onUpdateStatus={updateCustomMutation.mutate}
          onUpdateDownpayment={handleUpdateDownpayment}
          onDeleteCustom={handleDeleteCustom}
          isUpdating={updateCustomMutation.isPending || updateDownpaymentMutation.isPending || deleteCustomMutation.isPending}
        />
      </div>

      {/* Create Custom Modal */}
      <CreateCustomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['customs'] });
          setIsCreateModalOpen(false);
        }}
      />

      {/* Export Modal */}
      <EndorsedExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};

export default CustomsTracker;
