import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Clock, Mail, MoreHorizontal, Copy, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";

interface Invitation {
  id: string;
  email: string;
  token: string;
  invited_role: string;
  status: string;
  expires_at: string;
  created_at: string;
  accepted_at?: string;
}

export const InvitationList = () => {
  const { isAdmin } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error: any) {
      console.error('Error loading invitations:', error);
      toast.error('Kunde inte ladda inbjudningar');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  const copyInvitationLink = async (token: string) => {
    const invitationUrl = `${window.location.origin}/invitation/${token}`;
    try {
      await navigator.clipboard.writeText(invitationUrl);
      toast.success('Inbjudningslänk kopierad!');
    } catch (error) {
      toast.error('Kunde inte kopiera länk');
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    setCancellingId(invitationId);
    try {
      // Delete the invitation instead of updating status to avoid constraint issues
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('Inbjudan avbruten och borttagen');
      await loadInvitations(); // Refresh the list
    } catch (error: any) {
      console.error('Error canceling invitation:', error);
      toast.error('Kunde inte avbryta inbjudan');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusColor = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    
    if (status === 'accepted') return 'bg-green-100 text-green-700';
    if (status === 'expired' || isExpired) return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const getStatusText = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    
    if (status === 'accepted') return 'Accepterad';
    if (status === 'expired' || isExpired) return 'Utgången';
    return 'Väntande';
  };

  // Filter and limit invitations display
  const displayedInvitations = showAll ? invitations : invitations.slice(0, 5);
  const hasMoreInvitations = invitations.length > 5;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Laddar inbjudningar...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Skickade inbjudningar
        </CardTitle>
        <CardDescription>
          Hantera och övervaka inbjudningar som skickats till nya användare
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Inga inbjudningar har skickats än.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Visar {displayedInvitations.length} av {invitations.length} inbjudningar
              </span>
              {hasMoreInvitations && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? 'Visa färre' : `Visa alla (${invitations.length})`}
                </Button>
              )}
            </div>
            <div className="space-y-3">
            {displayedInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{invitation.email}</span>
                    <Badge variant="outline" className="text-xs">
                      {invitation.invited_role}
                    </Badge>
                    <Badge 
                      className={`text-xs ${getStatusColor(invitation.status, invitation.expires_at)}`}
                    >
                      {getStatusText(invitation.status, invitation.expires_at)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Skickad {formatDistanceToNow(new Date(invitation.created_at), { 
                        addSuffix: true, 
                        locale: sv 
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Går ut {formatDistanceToNow(new Date(invitation.expires_at), { 
                        addSuffix: true, 
                        locale: sv 
                      })}
                    </span>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={cancellingId === invitation.id}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border shadow-md z-50">
                    <DropdownMenuItem
                      onClick={() => copyInvitationLink(invitation.token)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Kopiera länk
                    </DropdownMenuItem>
                    {invitation.status !== 'accepted' && (
                      <DropdownMenuItem
                        onClick={() => cancelInvitation(invitation.id)}
                        className="text-red-600 focus:text-red-600"
                        disabled={cancellingId === invitation.id}
                      >
                        <X className="h-4 w-4 mr-2" />
                        {cancellingId === invitation.id 
                          ? 'Tar bort...' 
                          : (invitation.status === 'pending' && new Date(invitation.expires_at) > new Date()) 
                            ? 'Avbryt inbjudan' 
                            : 'Ta bort inbjudan'
                        }
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};