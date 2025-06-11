
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Copy, Check, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface PendingInvitation {
  token: string;
  model_name: string | null;
  created_at: string;
  expires_at: string | null;
}

const PendingLinksCard: React.FC = () => {
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string>("");

  const fetchPendingInvitations = async () => {
    setLoading(true);
    try {
      // Get all pending invitations
      const { data: pendingInvitations, error: invitationsError } = await supabase
        .from('creator_invitations')
        .select('token, model_name, created_at, expires_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (invitationsError) {
        console.error("Error fetching invitations:", invitationsError);
        throw invitationsError;
      }

      if (!pendingInvitations || pendingInvitations.length === 0) {
        setInvitations([]);
        return;
      }

      // Get all tokens that have been submitted
      const { data: submittedTokens, error: submissionsError } = await supabase
        .from('onboarding_submissions')
        .select('token');

      if (submissionsError) {
        console.error("Error fetching submissions:", submissionsError);
        // Continue without filtering if we can't get submissions
        setInvitations(pendingInvitations);
        return;
      }

      // Filter out invitations that have been submitted
      const submittedTokenSet = new Set(submittedTokens?.map(s => s.token) || []);
      const filteredInvitations = pendingInvitations.filter(
        invitation => !submittedTokenSet.has(invitation.token)
      );

      setInvitations(filteredInvitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      toast({
        variant: "destructive",
        title: "Failed to load pending links",
        description: "Could not load pending invitation links",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingInvitations();
  }, []);

  const copyLink = async (token: string) => {
    try {
      const appUrl = window.location.origin;
      const link = `${appUrl}/onboarding-form/${token}`;
      await navigator.clipboard.writeText(link);
      setCopiedToken(token);
      toast({
        title: "Link copied",
        description: "The onboarding link has been copied to your clipboard",
      });
      setTimeout(() => setCopiedToken(""), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Could not copy the link to clipboard",
      });
    }
  };

  const deleteInvitation = async (token: string) => {
    try {
      const { error } = await supabase
        .from('creator_invitations')
        .update({ status: 'cancelled' })
        .eq('token', token);

      if (error) throw error;

      toast({
        title: "Link cancelled",
        description: "The invitation link has been cancelled",
      });

      // Refresh the list
      fetchPendingInvitations();
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      toast({
        variant: "destructive",
        title: "Failed to cancel link",
        description: "Could not cancel the invitation link",
      });
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2 flex-shrink-0">
        <div>
          <CardTitle>Pending Invitation Links</CardTitle>
          <CardDescription>
            Manage pending creator onboarding links (active until submitted)
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchPendingInvitations}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        {loading ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Loading pending links...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No pending invitation links</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] w-full">
            <div className="space-y-3 pr-4">
              {invitations.map((invitation) => {
                return (
                  <div 
                    key={invitation.token} 
                    className="border rounded-lg p-3 border-border"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">
                            {invitation.model_name || 'Unnamed Model'}
                          </p>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            Active
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Created {formatDistanceToNow(new Date(invitation.created_at))} ago
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Valid until submitted
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyLink(invitation.token)}
                          disabled={copiedToken === invitation.token}
                        >
                          {copiedToken === invitation.token ? 
                            <Check className="h-3 w-3" /> : 
                            <Copy className="h-3 w-3" />
                          }
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteInvitation(invitation.token)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingLinksCard;
