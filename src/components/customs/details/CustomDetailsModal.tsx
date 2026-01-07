
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Custom } from '@/types/custom';
import CustomDetailsHeader from './CustomDetailsHeader';
import FanInfoSection from './FanInfoSection';
import DescriptionSection from './DescriptionSection';
import DatesSection from './DatesSection';
import PricingStatusSection from './PricingStatusSection';
import TeamInfoSection from './TeamInfoSection';
import AttachmentsSection from './AttachmentsSection';
import TimestampsSection from './TimestampsSection';

interface CustomDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  custom: Custom | null;
  onUpdateStatus?: (data: { customId: string; newStatus: string; chatterName?: string }) => void;
  onUpdateDownpayment?: (customId: string, newDownpayment: number) => void;
  onDeleteCustom?: (customId: string) => void;
  isUpdating?: boolean;
}

const CustomDetailsModal: React.FC<CustomDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  custom, 
  onUpdateStatus,
  onUpdateDownpayment,
  onDeleteCustom,
  isUpdating 
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Radix Dialog can set document.body{pointer-events:none} while open.
  // If a dialog unmounts during a mutation, cleanup can occasionally get stuck.
  // This ensures the app becomes clickable again after closing.
  useEffect(() => {
    if (!isOpen) {
      requestAnimationFrame(() => {
        document.body.style.removeProperty('pointer-events');
      });
      setIsDeleteDialogOpen(false);
    }

    return () => {
      document.body.style.removeProperty('pointer-events');
    };
  }, [isOpen]);

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setIsDeleteDialogOpen(false);
      onClose();
    }
  };
  const { data: currentCustom } = useQuery({
    queryKey: ['custom', custom?.id],
    queryFn: async () => {
      if (!custom?.id) return null;
      
      const { data, error } = await supabase
        .from('customs')
        .select('*')
        .eq('id', custom.id)
        .single();
      
      if (error) throw error;
      return data as Custom;
    },
    enabled: isOpen && !!custom?.id,
    refetchInterval: 1000, // Refetch every second when modal is open
  });

  // Use the fetched data if available, otherwise fall back to the passed custom
  const displayCustom = currentCustom || custom;

  if (!displayCustom) return null;

  const handleRefund = () => {
    if (onUpdateStatus && displayCustom) {
      onUpdateStatus({ customId: displayCustom.id, newStatus: 'refunded' });
    }
  };

  const handleDelete = () => {
    if (onDeleteCustom && displayCustom) {
      setIsDeleteDialogOpen(false);
      onDeleteCustom(displayCustom.id);
      onClose();
    }
  };

  const canRefund = displayCustom.status !== 'refunded' && onUpdateStatus;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <CustomDetailsHeader custom={displayCustom} />
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Fan Information */}
          <FanInfoSection custom={displayCustom} />

          {/* Description */}
          <DescriptionSection custom={displayCustom} />

          {/* Dates and Pricing - Reorganized Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Dates and Custom Type */}
            <DatesSection custom={displayCustom} />

            {/* Right Column - Pricing and Status */}
            <PricingStatusSection 
              custom={displayCustom} 
              onUpdateDownpayment={onUpdateDownpayment}
              isUpdating={isUpdating}
            />
          </div>

          {/* Team Info */}
          <TeamInfoSection custom={displayCustom} />

          {/* Attachments */}
          <AttachmentsSection custom={displayCustom} />

          {/* Timestamps */}
          <TimestampsSection custom={displayCustom} />
        </div>

        <div className="flex justify-between pt-4">
          <div className="flex gap-2">
            {canRefund && (
              <Button 
                variant="destructive" 
                onClick={handleRefund}
                disabled={isUpdating}
                className="gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Mark as Refunded
              </Button>
            )}
            {onDeleteCustom && (
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    disabled={isUpdating}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Custom
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this custom order and remove all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomDetailsModal;
