import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Trash2, RefreshCw, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Invitation {
  id: string;
  email: string;
  invited_role: string;
  status: string;
  created_at: string;
  expires_at: string;
  token: string;
}

interface PendingInvitationsProps {
  onRefresh?: () => void;
}

export function PendingInvitations({ onRefresh }: PendingInvitationsProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error: any) {
      console.error('Error loading invitations:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda inbjudningar",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteInvitation = async (invitationId: string) => {
    try {
      setDeleting(invitationId);
      
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      
      toast({
        title: "Inbjudan borttagen",
        description: "Inbjudan har tagits bort framgångsrikt"
      });

      onRefresh?.();
    } catch (error: any) {
      console.error('Error deleting invitation:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort inbjudan",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const getStatusIcon = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    
    if (isExpired) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    
    if (isExpired) {
      return <Badge variant="destructive">Utgången</Badge>;
    }
    
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Väntar</Badge>;
      case 'accepted':
        return <Badge variant="default">Accepterad</Badge>;
      case 'expired':
        return <Badge variant="destructive">Utgången</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Pågående inbjudningar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Laddar inbjudningar...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Pågående inbjudningar ({invitations.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadInvitations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Uppdatera
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium text-lg mb-2">Inga pågående inbjudningar</h3>
            <p className="text-muted-foreground">Skicka en inbjudan för att komma igång</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(invitation.status, invitation.expires_at)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{invitation.email}</span>
                      {getStatusBadge(invitation.status, invitation.expires_at)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Roll: {invitation.invited_role} • 
                      Skickad: {new Date(invitation.created_at).toLocaleDateString('sv-SE')} • 
                      Utgår: {new Date(invitation.expires_at).toLocaleDateString('sv-SE')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteInvitation(invitation.id)}
                    disabled={deleting === invitation.id}
                  >
                    {deleting === invitation.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}