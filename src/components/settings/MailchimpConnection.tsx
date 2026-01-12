/**
 * RealCoach.ai - Mailchimp Connection Component
 *
 * Manages the Mailchimp integration in Settings.
 * Handles OAuth flow, audience selection, and sync controls.
 */

import { useState, useEffect, useCallback } from "react";
import { Mail, Check, RefreshCw, Unlink, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  getConnection,
  getAudiences,
  updateAudience,
  queueAllContacts,
  type MailchimpConnection as Connection,
  type MailchimpAudience,
} from "@/lib/mailchimp-sync";

// ============================================================================
// COMPONENT
// ============================================================================

export function MailchimpConnection() {
  const { user, session } = useAuth();
  const { toast } = useToast();

  // State
  const [connection, setConnection] = useState<Connection | null>(null);
  const [audiences, setAudiences] = useState<MailchimpAudience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingAudiences, setIsLoadingAudiences] = useState(false);
  const [showAudienceSelector, setShowAudienceSelector] = useState(false);

  // Check URL params for OAuth callback results
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mailchimpStatus = params.get("mailchimp");
    const message = params.get("message");

    if (mailchimpStatus === "connected") {
      toast({
        title: "Mailchimp connected",
        description: "Your Mailchimp account has been linked successfully.",
      });
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (mailchimpStatus === "error") {
      toast({
        title: "Connection failed",
        description: message || "Failed to connect Mailchimp. Please try again.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [toast]);

  // Fetch connection status
  const fetchConnection = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const conn = await getConnection(user.id);
      setConnection(conn);

      // If connected but no audience selected, fetch audiences
      if (conn && !conn.audience_id) {
        setShowAudienceSelector(true);
        await fetchAudiences(conn);
      }
    } catch (error) {
      console.error("Error fetching connection:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConnection();
  }, [fetchConnection]);

  // Fetch Mailchimp audiences
  const fetchAudiences = async (conn: Connection) => {
    setIsLoadingAudiences(true);
    try {
      const audienceList = await getAudiences(conn);
      setAudiences(audienceList);

      // Auto-select if only one audience
      if (audienceList.length === 1) {
        await handleSelectAudience(audienceList[0].id, audienceList[0].name);
      }
    } catch (error) {
      console.error("Error fetching audiences:", error);
      toast({
        title: "Error loading audiences",
        description: "Could not fetch your Mailchimp audiences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAudiences(false);
    }
  };

  // Handle OAuth connection
  const handleConnect = async () => {
    if (!session?.access_token) {
      toast({
        title: "Authentication required",
        description: "Please sign in to connect Mailchimp.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const response = await fetch("/api/mailchimp/auth", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to initiate OAuth");
      }

      const { authUrl } = await response.json();

      // Redirect to Mailchimp OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error("OAuth error:", error);
      toast({
        title: "Connection failed",
        description: "Could not connect to Mailchimp. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    if (!session?.access_token) return;

    setIsDisconnecting(true);
    try {
      const response = await fetch("/api/mailchimp/disconnect", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to disconnect");
      }

      setConnection(null);
      setAudiences([]);
      setShowAudienceSelector(false);

      toast({
        title: "Mailchimp disconnected",
        description: "Your Mailchimp account has been unlinked. Your contacts in Mailchimp are still there.",
      });
    } catch (error) {
      console.error("Disconnect error:", error);
      toast({
        title: "Disconnect failed",
        description: "Could not disconnect Mailchimp. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Handle audience selection
  const handleSelectAudience = async (audienceId: string, audienceName: string) => {
    if (!user) return;

    try {
      await updateAudience(user.id, audienceId, audienceName);

      // Refresh connection
      const conn = await getConnection(user.id);
      setConnection(conn);
      setShowAudienceSelector(false);

      toast({
        title: "Audience selected",
        description: `Contacts will sync to "${audienceName}".`,
      });

      // Queue initial sync
      if (conn) {
        const count = await queueAllContacts(user.id);
        if (count > 0) {
          toast({
            title: "Initial sync queued",
            description: `${count} contacts will be synced to Mailchimp.`,
          });
        }
      }
    } catch (error) {
      console.error("Error selecting audience:", error);
      toast({
        title: "Error",
        description: "Could not select audience. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle manual sync
  const handleSyncNow = async () => {
    if (!user || !connection?.audience_id) return;

    // Check if last sync was within the hour (rate limit)
    if (connection.last_sync_at) {
      const lastSync = new Date(connection.last_sync_at);
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (lastSync > hourAgo) {
        toast({
          title: "Sync limit",
          description: "You can only sync manually once per hour. Contacts sync automatically anyway.",
        });
        return;
      }
    }

    setIsSyncing(true);
    try {
      const count = await queueAllContacts(user.id);

      toast({
        title: "Sync started",
        description: count > 0
          ? `${count} contacts queued for sync.`
          : "No contacts to sync (contacts need email addresses).",
      });

      // Refresh connection to update last_sync_at
      await fetchConnection();
    } catch (error) {
      console.error("Sync error:", error);
      toast({
        title: "Sync failed",
        description: "Could not start sync. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Format relative time
  const formatLastSync = (dateString: string | null) => {
    if (!dateString) return "Never";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="bg-background/50 border-border/30">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <Card className="bg-background/50 border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Mailchimp
          </CardTitle>
          <CardDescription>
            Sign in to connect your Mailchimp account.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Connected state
  if (connection && connection.audience_id) {
    return (
      <Card className="bg-background/50 border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Mailchimp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection status */}
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-foreground">
              Connected to "{connection.audience_name}"
            </span>
          </div>

          {/* Last sync time */}
          <div className="text-sm text-muted-foreground">
            Last synced: {formatLastSync(connection.last_sync_at)}
          </div>

          {/* Error notice */}
          {connection.sync_status === "error" && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Sync paused due to an error. Your contacts are still safe.
                {connection.last_error && (
                  <span className="block mt-1 text-xs opacity-70">
                    {connection.last_error}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="gap-2"
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Sync Now
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="gap-2 text-muted-foreground hover:text-destructive"
            >
              {isDisconnecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Unlink className="w-4 h-4" />
              )}
              Disconnect
            </Button>
          </div>

          {/* Info text */}
          <p className="text-xs text-muted-foreground pt-2">
            Contacts sync automatically. You don't need to do anything.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Audience selection state
  if (connection && showAudienceSelector) {
    return (
      <Card className="bg-background/50 border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Mailchimp
          </CardTitle>
          <CardDescription>
            Select which Mailchimp audience to sync your contacts to.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingAudiences ? (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading audiences...</span>
            </div>
          ) : audiences.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No audiences found. Please create an audience in Mailchimp first.
              </AlertDescription>
            </Alert>
          ) : (
            <Select
              onValueChange={(value) => {
                const audience = audiences.find((a) => a.id === value);
                if (audience) {
                  handleSelectAudience(audience.id, audience.name);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an audience" />
              </SelectTrigger>
              <SelectContent>
                {audiences.map((audience) => (
                  <SelectItem key={audience.id} value={audience.id}>
                    {audience.name} ({audience.member_count.toLocaleString()} members)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="gap-2 text-muted-foreground"
          >
            <Unlink className="w-4 h-4" />
            Cancel
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Disconnected state
  return (
    <Card className="bg-background/50 border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Mailchimp
        </CardTitle>
        <CardDescription>
          Connect your Mailchimp account to automatically sync your contacts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          className="gap-2"
        >
          {isConnecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ExternalLink className="w-4 h-4" />
          )}
          Connect Mailchimp
        </Button>
      </CardContent>
    </Card>
  );
}
