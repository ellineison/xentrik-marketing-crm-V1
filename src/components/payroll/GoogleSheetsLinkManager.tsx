import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Edit, Save, X, Link } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface GoogleSheetsLinkManagerProps {
  chatterId?: string;
  isAdminView?: boolean;
}

export const GoogleSheetsLinkManager: React.FC<GoogleSheetsLinkManagerProps> = ({
  chatterId,
  isAdminView = false
}) => {
  const [salesTrackerLink, setSalesTrackerLink] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [tempLink, setTempLink] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (chatterId) {
      fetchSalesTrackerLink();
    }
  }, [chatterId]);

  const fetchSalesTrackerLink = async () => {
    if (!chatterId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('sales_tracker_link')
        .eq('id', chatterId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setSalesTrackerLink((data as any)?.sales_tracker_link || '');
    } catch (error) {
      console.error('Error fetching sales tracker link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setTempLink(salesTrackerLink);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setTempLink('');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!chatterId) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ sales_tracker_link: tempLink } as any)
        .eq('id', chatterId);

      if (error) throw error;

      setSalesTrackerLink(tempLink);
      setIsEditing(false);
      setTempLink('');
      
      toast({
        title: "Success",
        description: "Google Sheets link updated successfully",
      });
    } catch (error) {
      console.error('Error updating sales tracker link:', error);
      toast({
        title: "Error",
        description: "Failed to update Google Sheets link",
        variant: "destructive",
      });
    }
  };

  const handleOpenLink = () => {
    if (salesTrackerLink) {
      window.open(salesTrackerLink, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-secondary/5 border-muted/50">
        <CardContent className="p-3">
          <div className="h-6 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-secondary/5 border-muted/50">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <Link className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Google Sheets Link:</span>
          
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="url"
                value={tempLink}
                onChange={(e) => setTempLink(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/..."
                className="flex-1 h-8 text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleSave}
                className="h-8 px-2"
              >
                <Save className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className="h-8 px-2"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              {salesTrackerLink ? (
                <>
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {salesTrackerLink}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenLink}
                    className="h-8 px-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  {!isAdminView && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEdit}
                      className="h-8 px-2"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <span className="text-xs text-muted-foreground flex-1">
                    No Google Sheets link set
                  </span>
                  {!isAdminView && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEdit}
                      className="h-8 px-2"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};