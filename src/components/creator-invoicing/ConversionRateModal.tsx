import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ConversionRateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (conversionRate: number | null) => void;
  invoiceAmountUsd: number | null;
}

export function ConversionRateModal({
  open,
  onOpenChange,
  onConfirm,
  invoiceAmountUsd,
}: ConversionRateModalProps) {
  const [conversionRate, setConversionRate] = useState<string>('');

  const parsedRate = conversionRate.trim() === '' ? null : parseFloat(conversionRate);
  const isValidRate = parsedRate === null || (!isNaN(parsedRate) && parsedRate > 0);
  
  const calculatedAud = parsedRate !== null && invoiceAmountUsd !== null && !isNaN(parsedRate)
    ? invoiceAmountUsd * parsedRate
    : null;

  const handleConfirm = () => {
    if (!isValidRate) return;
    onConfirm(parsedRate);
    setConversionRate('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setConversionRate('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>USD to AUD Conversion Rate</DialogTitle>
          <DialogDescription>
            Enter the conversion rate from USD to AUD. Leave empty if no conversion is required.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="conversionRate">Conversion Rate (1 USD = ? AUD)</Label>
            <Input
              id="conversionRate"
              type="number"
              step="0.0001"
              min="0"
              placeholder="e.g., 1.55"
              value={conversionRate}
              onChange={(e) => setConversionRate(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isValidRate) {
                  handleConfirm();
                }
              }}
              autoFocus
            />
          </div>
          
          {invoiceAmountUsd !== null && (
            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invoice Amount (USD):</span>
                <span className="font-medium">${invoiceAmountUsd.toFixed(2)}</span>
              </div>
              
              {calculatedAud !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Converted Amount (AUD):</span>
                  <span className="font-medium text-brand-yellow">${calculatedAud.toFixed(2)}</span>
                </div>
              )}
              
              {parsedRate === null && (
                <p className="text-xs text-muted-foreground italic">
                  No conversion will be applied. Invoice will show USD amount.
                </p>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isValidRate}>
            Generate PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
