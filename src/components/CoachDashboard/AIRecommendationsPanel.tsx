import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Brain, Clock, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface AIRecommendation {
  id: string;
  client_id: string;
  insight_type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  action_points: any;
  expires_at: string;
  created_at: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
  } | null;
}

export function AIRecommendationsPanel() {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      loadRecommendations();
    }
  }, [user?.id]);

  const loadRecommendations = async () => {
    try {
      // Hämta coach insights
      const { data: insights, error } = await supabase
        .from('coach_insights')
        .select('*')
        .eq('coach_id', user?.id)
        .in('status', ['active', 'acknowledged'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Hämta profile data separat
      const clientIds = insights?.map(i => i.client_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', clientIds);

      // Kombinera data
      const data = insights?.map(insight => ({
        ...insight,
        profiles: profiles?.find(p => p.id === insight.client_id)
      })) || [];

      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      toast({
        title: "Fel vid laddning",
        description: "Kunde inte ladda AI-rekommendationer",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeRecommendation = async (recommendationId: string) => {
    try {
      const { error } = await supabase
        .from('coach_insights')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', recommendationId);

      if (error) throw error;

      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId 
            ? { ...rec, status: 'acknowledged' as const }
            : rec
        )
      );

      toast({
        title: "Rekommendation bekräftad",
        description: "Du har tagit del av AI:s rekommendation",
        variant: "default"
      });
    } catch (error) {
      console.error('Error acknowledging recommendation:', error);
      toast({
        title: "Fel",
        description: "Kunde inte bekräfta rekommendationen",
        variant: "destructive"
      });
    }
  };

  const resolveRecommendation = async (recommendationId: string) => {
    try {
      const { error } = await supabase
        .from('coach_insights')
        .update({
          status: 'resolved'
        })
        .eq('id', recommendationId);

      if (error) throw error;

      setRecommendations(prev => 
        prev.filter(rec => rec.id !== recommendationId)
      );

      toast({
        title: "Rekommendation löst",
        description: "Rekommendationen har markerats som hanterad",
        variant: "default"
      });
    } catch (error) {
      console.error('Error resolving recommendation:', error);
      toast({
        title: "Fel",
        description: "Kunde inte lösa rekommendationen",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Rekommendationer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-full bg-muted h-8 w-8"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-32"></div>
                      <div className="h-3 bg-muted rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
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
          <Brain className="h-5 w-5" />
          AI Rekommendationer ({recommendations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((recommendation) => (
            <div key={recommendation.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {recommendation.profiles?.first_name?.[0]}
                      {recommendation.profiles?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-sm">{recommendation.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {recommendation.profiles?.first_name} {recommendation.profiles?.last_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getPriorityColor(recommendation.priority)} className="text-xs">
                    {getPriorityIcon(recommendation.priority)}
                    <span className="ml-1">{recommendation.priority}</span>
                  </Badge>
                  {recommendation.status === 'acknowledged' && (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Bekräftad
                    </Badge>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground">{recommendation.description}</p>

              {recommendation.action_points && Array.isArray(recommendation.action_points) && recommendation.action_points.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-medium">Föreslagna åtgärder:</h5>
                  <ul className="space-y-1">
                    {recommendation.action_points.map((action, index) => (
                      <li key={index} className="text-xs flex items-start gap-2">
                        <ArrowRight className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(recommendation.created_at), { 
                      addSuffix: true, 
                      locale: sv 
                    })}
                  </div>
                  {recommendation.expires_at && (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Upphör {formatDistanceToNow(new Date(recommendation.expires_at), { 
                        addSuffix: true, 
                        locale: sv 
                      })}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {recommendation.status === 'active' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => acknowledgeRecommendation(recommendation.id)}
                    >
                      Bekräfta
                    </Button>
                  )}
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => resolveRecommendation(recommendation.id)}
                  >
                    Markera som löst
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {recommendations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Inga aktiva AI-rekommendationer</p>
              <p className="text-sm">Systemet kommer automatiskt generera rekommendationer baserat på klientaktivitet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}