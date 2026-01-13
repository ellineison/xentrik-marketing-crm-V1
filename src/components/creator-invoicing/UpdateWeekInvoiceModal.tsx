import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image, Loader2 } from 'lucide-react';
import { CreatorInvoicingEntry, Creator } from './types';
import { cn } from '@/lib/utils';

interface UpdateWeekInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: Creator;
  entry: CreatorInvoicingEntry | null;
  weekStart: Date;
  onUpdate: (updates: Partial<CreatorInvoicingEntry>) => Promise<void>;
  onUpdateDefaultInvoiceNumber: (creatorId: string, invoiceNumber: number) => Promise<boolean>;
}

export function UpdateWeekInvoiceModal({
  isOpen,
  onClose,
  creator,
  entry,
  weekStart,
  onUpdate,
  onUpdateDefaultInvoiceNumber,
}: UpdateWeekInvoiceModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [statementsImageKey, setStatementsImageKey] = useState<string | null>(entry?.statements_image_key ?? null);
  const [conversionImageKey, setConversionImageKey] = useState<string | null>(entry?.conversion_image_key ?? null);
  const [defaultInvoiceNumber, setDefaultInvoiceNumber] = useState<string>(
    creator.default_invoice_number?.toString() ?? ''
  );
  const [uploadingStatements, setUploadingStatements] = useState(false);
  const [uploadingConversion, setUploadingConversion] = useState(false);

  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  const uploadFile = async (file: File, type: 'statements' | 'conversion'): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${creator.id}/${weekStartStr}/${type}_${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('invoicing_documents')
      .upload(fileName, file, { upsert: true });

    if (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload Error',
        description: `Failed to upload ${type} image`,
        variant: 'destructive',
      });
      return null;
    }

    return fileName;
  };

  const onDropStatements = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setUploadingStatements(true);
    const key = await uploadFile(acceptedFiles[0], 'statements');
    if (key) {
      setStatementsImageKey(key);
    }
    setUploadingStatements(false);
  }, [creator.id, weekStartStr]);

  const onDropConversion = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setUploadingConversion(true);
    const key = await uploadFile(acceptedFiles[0], 'conversion');
    if (key) {
      setConversionImageKey(key);
    }
    setUploadingConversion(false);
  }, [creator.id, weekStartStr]);

  const statementsDropzone = useDropzone({
    onDrop: onDropStatements,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxFiles: 1,
    disabled: uploadingStatements,
  });

  const conversionDropzone = useDropzone({
    onDrop: onDropConversion,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxFiles: 1,
    disabled: uploadingConversion,
  });

  const getImageUrl = (bucketKey: string | null): string | null => {
    if (!bucketKey) return null;
    const { data } = supabase.storage.from('invoicing_documents').getPublicUrl(bucketKey);
    return data?.publicUrl ?? null;
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      // Update default invoice number if changed
      const newInvoiceNum = defaultInvoiceNumber ? parseInt(defaultInvoiceNumber, 10) : null;
      if (newInvoiceNum !== null && newInvoiceNum !== creator.default_invoice_number) {
        await onUpdateDefaultInvoiceNumber(creator.id, newInvoiceNum);
      }

      // Update invoicing entry
      await onUpdate({
        statements_image_key: statementsImageKey,
        conversion_image_key: conversionImageKey,
      });

      toast({
        title: 'Success',
        description: 'Week invoice updated successfully',
      });

      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const removeStatementsImage = async () => {
    if (statementsImageKey) {
      await supabase.storage.from('invoicing_documents').remove([statementsImageKey]);
      setStatementsImageKey(null);
    }
  };

  const removeConversionImage = async () => {
    if (conversionImageKey) {
      await supabase.storage.from('invoicing_documents').remove([conversionImageKey]);
      setConversionImageKey(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update Week's Invoice</DialogTitle>
          <DialogDescription>
            {creator.model_name || creator.name} - Week of {format(weekStart, 'MMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Default Invoice Number */}
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Default Invoice Number (Model #)</Label>
            <p className="text-xs text-muted-foreground">
              This number will be used for all weeks. Invoice # format: DueDate-ModelNumber (e.g., 0115-01)
            </p>
            <Input
              id="invoiceNumber"
              type="number"
              min="1"
              value={defaultInvoiceNumber}
              onChange={(e) => setDefaultInvoiceNumber(e.target.value)}
              placeholder="e.g., 1"
              className="w-32"
            />
          </div>

          {/* Statements Image */}
          <div className="space-y-2">
            <Label>Week's Statements Image</Label>
            {statementsImageKey ? (
              <div className="relative border rounded-lg p-2 bg-muted/30">
                <img
                  src={getImageUrl(statementsImageKey) ?? ''}
                  alt="Statements"
                  className="max-h-40 object-contain mx-auto rounded"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={removeStatementsImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                {...statementsDropzone.getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                  statementsDropzone.isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                )}
              >
                <input {...statementsDropzone.getInputProps()} />
                {uploadingStatements ? (
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                ) : (
                  <>
                    <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drop statements image here, or click to select
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Conversion Image */}
          <div className="space-y-2">
            <Label>Week's USD to AUD Conversion Image</Label>
            {conversionImageKey ? (
              <div className="relative border rounded-lg p-2 bg-muted/30">
                <img
                  src={getImageUrl(conversionImageKey) ?? ''}
                  alt="Conversion"
                  className="max-h-40 object-contain mx-auto rounded"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={removeConversionImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                {...conversionDropzone.getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                  conversionDropzone.isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                )}
              >
                <input {...conversionDropzone.getInputProps()} />
                {uploadingConversion ? (
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drop conversion image here, or click to select
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
