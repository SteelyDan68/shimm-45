import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStefanInterventions } from '@/hooks/useStefanInterventions';
import { useNavigation } from '@/hooks/useNavigation';
import {
  TrendingUp,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  ArrowRight
} from 'lucide-react';

/**
 * 🎯 STEFAN ANALYTICS WIDGET - Comprehensive analytics view
 */

export const StefanAnalyticsWidget: React.FC = () => {
  const { interventions, getInterventionStats, behaviorAnalytics } = useStefanInterventions();
  const { navigateTo } = useNavigation();
  
  const stats = getInterventionStats();

  const recentInterventions = interventions
    .slice(0, 5)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'inactivity_check': return <Clock className="h-4 w-4" />;
      case 'task_reminder': return <AlertCircle className="h-4 w-4" />;
      case 'progress_celebration': return <CheckCircle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Totala meddelanden</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.responded}</p>
            <p className="text-sm text-muted-foreground">Svar från dig</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.responseRate}%</p>
            <p className="text-sm text-muted-foreground">Svarsfrekvens</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{behaviorAnalytics.length}</p>
            <p className="text-sm text-muted-foreground">Beteendeanalyser</p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Meddelandefördelning per prioritet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{stats.priorityStats.urgent}</div>
              <div className="text-sm text-muted-foreground">Brådskande</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{stats.priorityStats.high}</div>
              <div className="text-sm text-muted-foreground">Hög</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{stats.priorityStats.medium}</div>
              <div className="text-sm text-muted-foreground">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-600">{stats.priorityStats.low}</div>
              <div className="text-sm text-muted-foreground">Låg</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Interventions */}
      <Card>
        <CardHeader>
          <CardTitle>Senaste meddelanden från Stefan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentInterventions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Inga meddelanden från Stefan än
              </p>
            ) : (
              recentInterventions.map((intervention) => (
                <div key={intervention.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    {getTriggerIcon(intervention.trigger_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{intervention.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(intervention.created_at).toLocaleString('sv-SE')}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getPriorityColor(intervention.priority)}`}
                    >
                      {intervention.priority}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Analytics Link */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center space-y-3">
            <h3 className="font-medium">Vill du se mer detaljerad analytics?</h3>
            <p className="text-sm text-muted-foreground">
              Få djupare insikter om din utveckling och Stefan AI:s effektivitet
            </p>
            <Button 
              onClick={() => navigateTo('/user-analytics')}
              className="w-full max-w-sm mx-auto"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Öppna Avancerad Analytics
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};