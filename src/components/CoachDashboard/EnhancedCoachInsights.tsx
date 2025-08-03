import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, AlertTriangle, TrendingUp, Users, Clock, CheckCircle,
  MessageSquare, Target, BarChart3, Heart, ArrowRight, Eye, EyeOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useAutonomousCoach } from '@/hooks/useAutonomousCoach';

interface CoachInsight {
  id: string;
  client_id: string;
  insight_type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'expired';
  ai_generated: boolean;
  action_points: string[];
  data_sources: string[];
  created_at: string;
  expires_at?: string;
  client_name?: string;
  client_progress?: number;
}

interface AutonomousTrigger {
  id: string;
  user_id: string;
  trigger_type: string;
  condition_met_at: string;
  trigger_data: Record<string, any>;
  resolution_status: string;
  client_name?: string;
}

export const EnhancedCoachInsights = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { resolveTrigger, triggerStefanIntervention } = useAutonomousCoach();
  
  const [insights, setInsights] = useState<CoachInsight[]>([]);
  const [triggers, setTriggers] = useState<AutonomousTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('insights');

  // Ladda insights och triggers
  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Ladda coach insights enkelt utan joins först
      const { data: insightsData, error: insightsError } = await supabase
        .from('coach_insights')
        .select('*')
        .eq('coach_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (insightsError) throw insightsError;

      // Formatera insights data
      const formattedInsights = (insightsData || []).map(insight => ({
        ...insight,
        action_points: Array.isArray(insight.action_points) ? insight.action_points : [],
        data_sources: Array.isArray(insight.data_sources) ? insight.data_sources : [],
        client_name: 'Klient', // Placeholder - kan förbättras senare
        client_progress: 0
      })) as CoachInsight[];

      setInsights(formattedInsights);

      // Ladda autonomous triggers för coaches klienter
      const { data: clientsData } = await supabase
        .from('coach_client_assignments')
        .select('client_id')
        .eq('coach_id', user.id)
        .eq('is_active', true);

      if (clientsData && clientsData.length > 0) {
        const clientIds = clientsData.map(c => c.client_id);
        
        const { data: triggersData, error: triggersError } = await supabase
          .from('autonomous_triggers')
          .select('*')
          .in('user_id', clientIds)
          .in('resolution_status', ['pending', 'intervened'])
          .order('condition_met_at', { ascending: false });

        if (triggersError) throw triggersError;

        const formattedTriggers = (triggersData || []).map(trigger => ({
          ...trigger,
          trigger_data: typeof trigger.trigger_data === 'object' ? trigger.trigger_data : {},
          client_name: 'Klient' // Placeholder
        })) as AutonomousTrigger[];

        setTriggers(formattedTriggers);
      }

    } catch (error) {
      console.error('Error loading coach data:', error);
      toast({
        title: "Fel vid laddning",
        description: "Kunde inte ladda coach-insikter",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Uppdatera var 5:e minut
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Hantera insight åtgärder
  const handleInsightAction = async (insightId: string, action: 'acknowledge' | 'resolve') => {
    try {
      const newStatus = action === 'acknowledge' ? 'acknowledged' : 'resolved';
      
      await supabase
        .from('coach_insights')
        .update({ 
          status: newStatus,
          acknowledged_at: action === 'acknowledge' ? new Date().toISOString() : undefined
        })
        .eq('id', insightId);

      await loadData();

      toast({
        title: action === 'acknowledge' ? "Insikt bekräftad" : "Insikt löst",
        description: "Statusen har uppdaterats",
        variant: "default"
      });
    } catch (error) {
      console.error('Error updating insight:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera insikt",
        variant: "destructive"
      });
    }
  };

  // Hantera trigger åtgärder
  const handleTriggerAction = async (trigger: AutonomousTrigger, action: 'resolve' | 'escalate') => {
    try {
      if (action === 'resolve') {
        await resolveTrigger(trigger.id);
        toast({
          title: "Trigger löst",
          description: `${trigger.client_name} - ${trigger.trigger_type} har markerats som löst`,
          variant: "default"
        });
      } else {
        // Eskalera till Stefan AI
        await triggerStefanIntervention(trigger.trigger_type, {
          trigger_id: trigger.id,
          trigger_data: trigger.trigger_data,
          escalated_by_coach: user?.id
        });
        
        toast({
          title: "Eskalerat till Stefan",
          description: `Stefan kommer att kontakta ${trigger.client_name}`,
          variant: "default"
        });
      }

      await loadData();
    } catch (error) {
      console.error('Error handling trigger action:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hantera åtgärd",
        variant: "destructive"
      });
    }
  };

  // Prioritetsikon och färg
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'critical':
        return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
      case 'high':
        return { icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
      case 'medium':
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
      default:
        return { icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    }
  };

  // Trigger type mapping
  const getTriggerTypeConfig = (triggerType: string) => {
    switch (triggerType) {
      case 'engagement_drop':
        return { icon: Users, label: 'Aktivitet har minskat', color: 'text-orange-600' };
      case 'progress_stalled':
        return { icon: BarChart3, label: 'Progression har stannat', color: 'text-red-600' };
      case 'assessment_abandoned':
        return { icon: Target, label: 'Avbruten bedömning', color: 'text-yellow-600' };
      case 'negative_sentiment':
        return { icon: Heart, label: 'Negativ känsla upptäckt', color: 'text-red-600' };
      default:
        return { icon: AlertTriangle, label: triggerType, color: 'text-gray-600' };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Laddar AI-insikter...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Coach Insights
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-red-600">
              {insights.filter(i => i.priority === 'critical').length} Kritiska
            </Badge>
            <Badge variant="outline" className="text-orange-600">
              {triggers.length} Aktiva triggers
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="insights">
              AI-Insikter ({insights.length})
            </TabsTrigger>
            <TabsTrigger value="triggers">
              Autonoma Triggers ({triggers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-4">
            {insights.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Fantastiskt! Inga insikter kräver din uppmärksamhet just nu. 
                  Alla dina klienter verkar må bra! 🎉
                </AlertDescription>
              </Alert>
            ) : (
              insights.map(insight => {
                const priorityConfig = getPriorityConfig(insight.priority);
                const IconComponent = priorityConfig.icon;

                return (
                  <Card 
                    key={insight.id} 
                    className={`${priorityConfig.border} ${priorityConfig.bg}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <IconComponent className={`h-5 w-5 mt-0.5 ${priorityConfig.color}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{insight.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {insight.client_name}
                              </Badge>
                              {insight.ai_generated && (
                                <Badge variant="secondary" className="text-xs">
                                  AI-Genererad
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {insight.description}
                            </p>
                            
                            {insight.client_progress !== undefined && (
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-muted-foreground">Klientens framsteg:</span>
                                <Progress value={insight.client_progress} className="h-2 w-20" />
                                <span className="text-xs font-medium">{insight.client_progress}%</span>
                              </div>
                            )}

                            {insight.action_points.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Rekommenderade åtgärder:
                                </p>
                                <ul className="text-xs space-y-1">
                                  {insight.action_points.slice(0, 3).map((action, idx) => (
                                    <li key={idx} className="flex items-start gap-1">
                                      <ArrowRight className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                                      {action}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Badge 
                          variant={insight.priority === 'critical' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {insight.priority.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          {new Date(insight.created_at).toLocaleDateString('sv-SE')}
                        </span>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleInsightAction(insight.id, 'acknowledge')}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Bekräfta
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleInsightAction(insight.id, 'resolve')}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Löst
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="triggers" className="space-y-4">
            {triggers.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Inga autonoma triggers är aktiva. Systemet övervakar kontinuerligt dina klienters välmående.
                </AlertDescription>
              </Alert>
            ) : (
              triggers.map(trigger => {
                const triggerConfig = getTriggerTypeConfig(trigger.trigger_type);
                const IconComponent = triggerConfig.icon;

                return (
                  <Card key={trigger.id} className="border-yellow-200 bg-yellow-50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <IconComponent className={`h-5 w-5 mt-0.5 ${triggerConfig.color}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{triggerConfig.label}</h4>
                              <Badge variant="outline" className="text-xs">
                                {trigger.client_name}
                              </Badge>
                            </div>
                            
                            <div className="text-xs text-muted-foreground space-y-1">
                              {trigger.trigger_data.hours_inactive && (
                                <p>Inaktiv i {Math.round(trigger.trigger_data.hours_inactive)} timmar</p>
                              )}
                              {trigger.trigger_data.current_progress !== undefined && (
                                <p>Nuvarande framsteg: {trigger.trigger_data.current_progress}%</p>
                              )}
                              {trigger.trigger_data.abandoned_count && (
                                <p>{trigger.trigger_data.abandoned_count} avbrutna bedömningar</p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <Badge variant="outline" className="text-xs">
                          {trigger.resolution_status}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          {new Date(trigger.condition_met_at).toLocaleDateString('sv-SE')}
                        </span>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTriggerAction(trigger, 'escalate')}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Stefan AI
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleTriggerAction(trigger, 'resolve')}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Löst
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};