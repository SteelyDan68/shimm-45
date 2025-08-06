import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStefanInterventions } from '@/hooks/useStefanInterventions';
import { useMessagingV2 } from '@/hooks/useMessagingV2';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useRoleCache } from '@/hooks/useRoleCache';
import {
  MessageSquare,
  Brain,
  Clock,
  CheckCircle,
  AlertCircle,
  Heart,
  Target,
  Zap,
  Filter,
  TrendingUp,
  Activity
} from 'lucide-react';

/**
 * 🚀 STEFAN AUTONOMOUS MESSAGING INTERFACE - SPRINT 1 REFACTOR
 * ✅ Real data implementation - No more mock data
 * ✅ Unified interface for Stefan interactions  
 * ✅ Pillar integration and assessment correlation
 * ✅ Enterprise-grade UX with behavior analytics
 * ✅ Role-based functionality with proper permissions
 */

export const AutonomousMessagingInterface: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin } = useRoleCache();
  
  // Use real Stefan interventions instead of mock data
  const {
    interventions,
    behaviorAnalytics,
    loading,
    analyzing,
    createIntervention,
    updateUserResponse,
    performBehaviorAnalysis,
    getFilteredInterventions,
    getInterventionStats
  } = useStefanInterventions();
  
  const { conversations, totalUnreadCount } = useMessagingV2();
  const [messageFilter, setMessageFilter] = useState<'all' | 'today' | 'week'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  // Stefan conversation finder
  const stefanConversation = conversations.find(conv => 
    conv.participant_ids?.includes('00000000-0000-0000-0000-000000000001')
  );

  // Get intervention statistics
  const stats = getInterventionStats();
  
  // Get filtered interventions based on current filters
  const filteredInterventions = getFilteredInterventions(messageFilter, priorityFilter);

  // Handle full behavior analysis
  const handleFullBehaviorAnalysis = async () => {
    if (!user) return;
    await performBehaviorAnalysis();
  };

  // Handle test message creation (admin only)
  const handleTestMessage = async (triggerType: string) => {
    if (!user || !isAdmin) return;
    
    const testMessages = {
      inactivity_check: 'Admin Test: Hej! Jag märkte att du har varit borta ett tag. Hur går det?',
      progress_celebration: 'Admin Test: Fantastiskt! Du har gjort stora framsteg idag! 🎉',
      task_reminder: 'Admin Test: Påminnelse: Du har viktiga uppgifter att slutföra.',
      motivation_boost: 'Admin Test: Du gör ett fantastiskt jobb! Fortsätt så här! 💪',
      assessment_prompt: 'Admin Test: Dags för en ny assessment för att följa dina framsteg.',
      pillar_focus: 'Admin Test: Låt oss fokusera på din Self Care pillar idag.'
    };

    const message = testMessages[triggerType as keyof typeof testMessages] || 'Test message';
    await createIntervention(triggerType, message, 'medium', { 
      test_message: true, 
      created_by_admin: user.id 
    });
  };

  // Handle user response to intervention  
  const handleUserResponseSubmit = async (interventionId: string, response: string) => {
    const success = await updateUserResponse(interventionId, response);
    if (success) {
      // Could show success feedback here
    }
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'inactivity_check': return <Clock className="h-4 w-4" />;
      case 'task_reminder': return <AlertCircle className="h-4 w-4" />;
      case 'progress_celebration': return <CheckCircle className="h-4 w-4" />;
      case 'motivation_boost': return <Heart className="h-4 w-4" />;
      case 'learning_opportunity': return <Target className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="border-purple-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Stefan AI - Intelligent Messaging</CardTitle>
              <p className="text-sm text-muted-foreground">
                Proaktiv coaching baserat på ditt beteende
              </p>
            </div>
          </div>
          {totalUnreadCount > 0 && (
            <Badge variant="destructive">
              {totalUnreadCount} nya meddelanden
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stefan Conversation Status */}
        {stefanConversation && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Aktiv konversation med Stefan</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {stefanConversation.last_message_at ? 'Senaste aktivitet: ' + new Date(stefanConversation.last_message_at).toLocaleString('sv-SE') : 'Ingen meddelanden än...'}
            </p>
            <Button 
              size="sm" 
              onClick={() => window.location.href = '/messages'}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Öppna konversation
            </Button>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleFullBehaviorAnalysis}
              disabled={analyzing || loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              {analyzing ? 'Analyserar ditt beteende...' : 'Kör Smart AI-Analys'}
            </Button>
            
            {behaviorAnalytics.length > 0 && (
              <div className="text-xs text-muted-foreground text-center">
                Senaste analys: {new Date(behaviorAnalytics[0]?.generated_at).toLocaleString('sv-SE')}
              </div>
            )}
          </div>
        </div>

        {/* Message Filter Controls */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Stefan's Meddelanden
              <Badge variant="secondary" className="text-xs">
                {filteredInterventions.length}
              </Badge>
            </h3>
            <div className="flex gap-1">
              <Button
                variant={messageFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMessageFilter('all')}
                className="text-xs h-6 px-2"
              >
                Alla
              </Button>
              <Button
                variant={messageFilter === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMessageFilter('today')}
                className="text-xs h-6 px-2"
              >
                Idag
              </Button>
              <Button
                variant={messageFilter === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMessageFilter('week')}
                className="text-xs h-6 px-2"
              >
                Vecka
              </Button>
            </div>
          </div>
          
          {/* Priority Filter */}
          <div className="flex gap-1 mb-3">
            <Button
              variant={priorityFilter === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPriorityFilter('')}
              className="text-xs h-6 px-2"
            >
              Alla prioriteter
            </Button>
            <Button
              variant={priorityFilter === 'urgent' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setPriorityFilter('urgent')}
              className="text-xs h-6 px-2"
            >
              Brådskande
            </Button>
            <Button
              variant={priorityFilter === 'high' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPriorityFilter('high')}
              className="text-xs h-6 px-2"
            >
              Hög
            </Button>
          </div>

          <ScrollArea className="h-64">
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm">Laddar Stefan meddelanden...</p>
                </div>
              ) : filteredInterventions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Inga meddelanden {messageFilter === 'all' ? 'än' : `för ${messageFilter === 'today' ? 'idag' : 'denna vecka'}`}</p>
                  <p className="text-xs">Stefan kommer skicka meddelanden baserat på ditt beteende</p>
                  {stats.total === 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleFullBehaviorAnalysis}
                      className="mt-3"
                      disabled={analyzing}
                    >
                      Starta AI-analys
                    </Button>
                  )}
                </div>
              ) : (
                filteredInterventions.map((intervention) => (
                  <div key={intervention.id} className="p-3 border rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTriggerIcon(intervention.trigger_type)}
                        <span className="text-xs font-medium capitalize">
                          {intervention.trigger_type.replace('_', ' ')}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getPriorityColor(intervention.priority)}`}
                        >
                          {intervention.priority}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(intervention.created_at).toLocaleTimeString('sv-SE')}
                      </span>
                    </div>
                    
                    <p className="text-sm mb-2">{intervention.content}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {intervention.user_responded ? (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Svarade: {intervention.responded_at ? new Date(intervention.responded_at).toLocaleString('sv-SE') : 'Okänt'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Väntar på svar
                          </Badge>
                        )}
                      </div>
                      
                      {intervention.effectiveness_score && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-blue-500" />
                          <span className="text-xs text-blue-600">
                            {Math.round(intervention.effectiveness_score * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Show user response if available */}
                    {intervention.user_response && (
                      <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                        <span className="font-medium">Ditt svar:</span> "{intervention.user_response}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Admin Test Controls (Only for Admins) */}
        {isAdmin && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3 text-orange-600 flex items-center gap-2">
              🔧 Admin Test-funktioner
              <Badge variant="secondary" className="text-xs">Endast admin</Badge>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestMessage('inactivity_check')}
                disabled={analyzing || loading}
                className="justify-start text-xs"
              >
                <Clock className="h-3 w-3 mr-1" />
                Test Inaktivitet
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestMessage('progress_celebration')}
                disabled={analyzing || loading}
                className="justify-start text-xs"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Test Framsteg
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestMessage('task_reminder')}
                disabled={analyzing || loading}
                className="justify-start text-xs"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                Test Påminnelse
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestMessage('motivation_boost')}
                disabled={analyzing || loading}
                className="justify-start text-xs"
              >
                <Heart className="h-3 w-3 mr-1" />
                Test Motivation
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestMessage('assessment_prompt')}
                disabled={analyzing || loading}
                className="justify-start text-xs"
              >
                <Target className="h-3 w-3 mr-1" />
                Test Assessment
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestMessage('pillar_focus')}
                disabled={analyzing || loading}
                className="justify-start text-xs"
              >
                <Activity className="h-3 w-3 mr-1" />
                Test Pillar
              </Button>
            </div>
          </div>
        )}

        {/* Real Analytics Overview */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Stefan Analytics
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Totala meddelanden</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.responded}</p>
              <p className="text-xs text-muted-foreground">Svar från dig</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.responseRate}%</p>
              <p className="text-xs text-muted-foreground">Svarsfrekvens</p>
            </div>
          </div>
          
          {/* Priority breakdown */}
          {stats.total > 0 && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex justify-between text-xs">
                <span className="text-red-600">Brådskande: {stats.priorityStats.urgent}</span>
                <span className="text-orange-600">Hög: {stats.priorityStats.high}</span>
                <span className="text-blue-600">Medium: {stats.priorityStats.medium}</span>
                <span className="text-gray-600">Låg: {stats.priorityStats.low}</span>
              </div>
            </div>
          )}
          
          {/* Behavior analytics summary */}
          {behaviorAnalytics.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                {behaviorAnalytics.length} aktiva beteendeanalyser · 
                Genomsnittlig effektivitet: {stats.avgEffectiveness > 0 ? `${stats.avgEffectiveness}/5` : 'Ej mätt'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};