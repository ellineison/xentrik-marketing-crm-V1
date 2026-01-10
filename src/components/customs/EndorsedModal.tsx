
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Custom {
  id: string;
  model_name: string;
  fan_display_name: string;
  fan_username: string | null;
  description: string;
  sale_date: string;
  due_date: string | null;
  downpayment: number;
  full_price: number;
  status: string;
  created_at: string;
  updated_at: string;
  sale_by: string;
  endorsed_by?: string;
  sent_by?: string;
  attachments?: string[] | null;
}

interface EndorsedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (endorserName: string) => void;
  custom: Custom | null;
}

const EndorsedModal: React.FC<EndorsedModalProps> = ({ isOpen, onClose, onConfirm, custom }) => {
  const [endorserName, setEndorserName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (endorserName.trim()) {
      onConfirm(endorserName.trim());
      setEndorserName('');
    }
  };

  const handleClose = () => {
    setEndorserName('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Custom as Endorsed</DialogTitle>
        </DialogHeader>
        
        {custom && (
          <div className="py-4">
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Custom for:</p>
              <p className="font-medium">{custom.model_name}</p>
              <p className="text-sm text-muted-foreground">
                {custom.fan_display_name} (@{custom.fan_username})
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="endorserName">Endorser Name</Label>
                <Input
                  id="endorserName"
                  placeholder="Enter the name of who endorsed this custom"
                  value={endorserName}
                  onChange={(e) => setEndorserName(e.target.value)}
                  required
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!endorserName.trim()}>
                  Mark as Endorsed
                </Button>
              </DialogFooter>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EndorsedModal;
