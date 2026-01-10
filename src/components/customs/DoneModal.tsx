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

interface DoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (chatterName: string) => void;
  custom: Custom | null;
}

const DoneModal: React.FC<DoneModalProps> = ({ isOpen, onClose, onConfirm, custom }) => {
  const [chatterName, setChatterName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatterName.trim()) {
      onConfirm(chatterName.trim());
      setChatterName('');
    }
  };

  const handleClose = () => {
    setChatterName('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Custom as Done</DialogTitle>
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
                <Label htmlFor="chatterName">Chatter Name</Label>
                <Input
                  id="chatterName"
                  placeholder="Enter the name of the chatter who sent this custom"
                  value={chatterName}
                  onChange={(e) => setChatterName(e.target.value)}
                  required
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!chatterName.trim()}>
                  Mark as Done
                </Button>
              </DialogFooter>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DoneModal;
