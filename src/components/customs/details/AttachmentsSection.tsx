
import React from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Download, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Custom } from '@/types/custom';

interface AttachmentsSectionProps {
  custom: Custom;
}

const AttachmentsSection: React.FC<AttachmentsSectionProps> = ({ custom }) => {
  const { toast } = useToast();

  const handleDownloadAttachment = async (attachmentPath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('custom_attachments')
        .download(attachmentPath);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachmentPath.split('/').pop() || 'attachment';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download attachment",
        variant: "destructive",
      });
      console.error('Error downloading attachment:', error);
    }
  };

  const handleViewAttachment = async (attachmentPath: string) => {
    try {
      const { data } = await supabase.storage
        .from('custom_attachments')
        .getPublicUrl(attachmentPath);
      
      window.open(data.publicUrl, '_blank');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to view attachment",
        variant: "destructive",
      });
      console.error('Error viewing attachment:', error);
    }
  };

  if (!custom.attachments || custom.attachments.length === 0) {
    return null;
  }

  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground">Attachments</label>
      <div className="mt-2 space-y-2">
        {custom.attachments.map((attachmentPath, index) => (
          <div key={index} className="flex items-center justify-between bg-secondary/20 p-3 rounded">
            <div className="flex items-center">
              <Paperclip className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-foreground text-sm">
                {attachmentPath.split('/').pop() || `Attachment ${index + 1}`}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleViewAttachment(attachmentPath)}
                className="flex items-center gap-1 h-8 px-2"
              >
                <Eye className="h-3 w-3" />
                View
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDownloadAttachment(attachmentPath)}
                className="flex items-center gap-1 h-8 px-2"
              >
                <Download className="h-3 w-3" />
                Download
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttachmentsSection;
