import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { Clock, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface ClientData {
  id: string;
  user_id: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
  user_journey_tracking: {
    current_phase: string;
    overall_progress: number;
    last_activity_at: string;
    next_recommended_assessment: string;
  };
  autonomous_triggers: Array<{
    id: string;
    trigger_type: string;
    resolution_status: string;
    condition_met_at: string;
  }>;
}

export function ClientOverview() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      loadClientData();
    }
  }, [user?.id]);

  const loadClientData = async () => {
    try {
      const { data: assignments } = await supabase
        .from('coach_client_assignments')
        .select(`
          client_id,
          coach_client_assignments!inner(
            client_id,
            profiles!coach_client_assignments_client_id_fkey(
              id,
              first_name,
              last_name,
              email
            )
          ),
          user_journey_tracking!coach_client_assignments_client_id_fkey(
            current_phase,
            overall_progress,
            last_activity_at,
            next_recommended_assessment
          )
        `)
        .eq('coach_id', user?.id)
        .eq('is_active', true);

      if (assignments) {
        // Hämta autonomous triggers för varje klient
        for (const assignment of assignments) {
          const { data: triggers } = await supabase
            .from('autonomous_triggers')
            .select('*')
            .eq('user_id', assignment.client_id)
            .in('resolution_status', ['pending', 'intervened'])
            .order('condition_met_at', { ascending: false })
            .limit(3);

          (assignment as any).autonomous_triggers = triggers || [];
        }

        setClients(assignments as any);
      }
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (progress: number, lastActivity: string) => {
    const daysSinceActivity = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceActivity > 7) return 'destructive';
    if (progress < 25) return 'secondary';
    if (progress > 75) return 'default';
    return 'outline';
  };

  const getStatusText = (progress: number, lastActivity: string) => {
    const daysSinceActivity = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceActivity > 7) return 'Inaktiv';
    if (progress < 25) return 'Nybörjare';
    if (progress > 75) return 'Framskriden';
    return 'Aktiv';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Klientöversikt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-muted h-10 w-10"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Klientöversikt ({clients.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clients.map((client) => (
            <div key={client.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {client.profiles?.first_name?.[0]}{client.profiles?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">
                      {client.profiles?.first_name} {client.profiles?.last_name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {client.profiles?.email}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={getStatusColor(
                    client.user_journey_tracking?.overall_progress || 0,
                    client.user_journey_tracking?.last_activity_at || ''
                  )}
                >
                  {getStatusText(
                    client.user_journey_tracking?.overall_progress || 0,
                    client.user_journey_tracking?.last_activity_at || ''
                  )}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span>{client.user_journey_tracking?.overall_progress || 0}% framsteg</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {client.user_journey_tracking?.last_activity_at 
                      ? formatDistanceToNow(new Date(client.user_journey_tracking.last_activity_at), { 
                          addSuffix: true, 
                          locale: sv 
                        })
                      : 'Okänd'
                    }
                  </span>
                </div>
              </div>

              {client.autonomous_triggers?.length > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">Aktiva triggers ({client.autonomous_triggers.length})</span>
                  </div>
                  <div className="space-y-1">
                    {client.autonomous_triggers.slice(0, 2).map((trigger) => (
                      <div key={trigger.id} className="text-xs bg-amber-50 p-2 rounded">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{trigger.trigger_type.replace('_', ' ')}</span>
                          <Badge variant="outline" className="text-xs">
                            {trigger.resolution_status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(trigger.condition_met_at), { 
                            addSuffix: true, 
                            locale: sv 
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <div className="text-xs text-muted-foreground">
                  Fas: {client.user_journey_tracking?.current_phase || 'Okänd'}
                </div>
                <Button variant="outline" size="sm">
                  Visa detaljer
                </Button>
              </div>
            </div>
          ))}

          {clients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Inga aktiva klienter tilldelade</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}