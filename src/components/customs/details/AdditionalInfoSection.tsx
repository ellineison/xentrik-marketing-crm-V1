
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Save, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Custom } from '@/types/custom';

interface AdditionalInfoSectionProps {
  custom: Custom;
}

const AdditionalInfoSection: React.FC<AdditionalInfoSectionProps> = ({ custom }) => {
  const [isEditingCustomType, setIsEditingCustomType] = useState(false);
  const [editedCustomType, setEditedCustomType] = useState(custom.custom_type || 'Video');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  React.useEffect(() => {
    setEditedCustomType(custom.custom_type || 'Video');
  }, [custom.custom_type]);

  const updateCustomTypeMutation = useMutation({
    mutationFn: async ({ customId, customType }: { customId: string; customType: string | null }) => {
      const { error } = await supabase
        .from('customs')
        .update({ 
          custom_type: customType,
          updated_at: new Date().toISOString()
        })
        .eq('id', customId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customs'] });
      setIsEditingCustomType(false);
      toast({
        title: "Success",
        description: "Custom type updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update custom type",
        variant: "destructive",
      });
      console.error('Error updating custom type:', error);
    }
  });

  const handleSaveCustomType = () => {
    updateCustomTypeMutation.mutate({
      customId: custom.id,
      customType: editedCustomType
    });
  };

  const handleCancelCustomType = () => {
    setEditedCustomType(custom.custom_type || 'Video');
    setIsEditingCustomType(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-muted-foreground">Custom Type</label>
        {!isEditingCustomType && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditingCustomType(true)}
            disabled={updateCustomTypeMutation.isPending}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <Edit className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {isEditingCustomType ? (
        <div className="space-y-2">
          <Select value={editedCustomType} onValueChange={setEditedCustomType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select custom type" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-background border border-border">
              <SelectItem value="Video">Video</SelectItem>
              <SelectItem value="Photo(s)">Photo(s)</SelectItem>
              <SelectItem value="Video Call">Video Call</SelectItem>
              <SelectItem value="Fan Gift">Fan Gift</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveCustomType}
              disabled={updateCustomTypeMutation.isPending}
              className="h-8 w-8 p-0"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelCustomType}
              disabled={updateCustomTypeMutation.isPending}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-foreground bg-secondary/20 p-3 rounded">
          {custom.custom_type || 'Not specified'}
        </p>
      )}
    </div>
  );
};

export default AdditionalInfoSection;
