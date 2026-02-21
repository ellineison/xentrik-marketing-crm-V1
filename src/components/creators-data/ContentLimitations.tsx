import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface ContentLimitationsProps {
  creatorId: string | null;
  limitations: Record<string, boolean>;
  isAdmin: boolean;
}

const LIMITATION_LABELS: Record<string, string> = {
  tits: 'Tits',
  pussy: 'Pussy',
  face_with_tits: 'Face w/ tits',
  face_with_pussy: 'Face w/ pussy',
  wholesome_selfie: 'Wholesome Selfie',
};

const LIMITATION_ORDER = ['tits', 'pussy', 'face_with_tits', 'face_with_pussy', 'wholesome_selfie'];

const ContentLimitations: React.FC<ContentLimitationsProps> = ({
  creatorId,
  limitations,
  isAdmin,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localLimitations, setLocalLimitations] = useState<Record<string, boolean>>(limitations);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (key: string) => {
    if (!isAdmin || !creatorId || isSaving) return;

    const newValue = !localLimitations[key];
    const updated = { ...localLimitations, [key]: newValue };
    setLocalLimitations(updated);
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('creators')
        .update({ content_limitations: updated })
        .eq('id', creatorId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['creator-by-email'] });
      toast({
        title: 'Limitation updated',
        description: `${LIMITATION_LABELS[key]} set to ${newValue ? '✅' : '❌'}`,
      });
    } catch (error) {
      // Revert on error
      setLocalLimitations(localLimitations);
      console.error('Error updating limitations:', error);
      toast({
        title: 'Update failed',
        description: 'Could not update content limitation.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Sync with parent when limitations prop changes
  React.useEffect(() => {
    setLocalLimitations(limitations);
  }, [limitations]);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      {LIMITATION_ORDER.map((key) => {
        const allowed = localLimitations[key] ?? false;
        return (
          <span
            key={key}
            className={`inline-flex items-center gap-1 ${isAdmin ? 'cursor-pointer hover:opacity-80' : ''} ${isSaving ? 'opacity-50' : ''}`}
            onClick={() => handleToggle(key)}
            title={isAdmin ? `Click to toggle ${LIMITATION_LABELS[key]}` : LIMITATION_LABELS[key]}
          >
            <span className="text-muted-foreground">{LIMITATION_LABELS[key]}?</span>
            <span>{allowed ? '✅' : '❌'}</span>
          </span>
        );
      })}
    </div>
  );
};

export default ContentLimitations;
