import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProactiveMessaging } from '@/hooks/useProactiveMessaging';
import { useMessagingV2 } from '@/hooks/useMessagingV2';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import {
  MessageSquare,
  Brain,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  Heart,
  Target,
  Zap
} from 'lucide-react';

/**
 * 🤖 AUTONOMOUS MESSAGING INTERFACE
 * Stefan kan nu skicka meddelanden proaktivt till användare
 */

interface ProactiveMessageLog {
  id: string;
  trigger_type: string;
  content: string;
  sent_at: string;
  priority: string;
  user_responded: boolean;
}

export const AutonomousMessagingInterface: React.FC = () => {
  const { user } = useAuth();
  const { 
    sendProactiveMessage, 
    sendMotivationalMessage,
    analyzeAndSendProactiveMessages 
  } = useProactiveMessaging();
  
  const { conversations, totalUnreadCount } = useMessagingV2();
  const [recentMessages, setRecentMessages] = useState<ProactiveMessageLog[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Hämta senaste proaktiva meddelanden
  useEffect(() => {
    // Mock data för demonstration - i verkligheten skulle detta komma från databasen
    const mockMessages: ProactiveMessageLog[] = [
      {
        id: '1',
        trigger_type: 'inactivity_check',
        content: 'Hej! Jag märkte att du har varit borta ett tag. Hur går det med din utvecklingsresa?',
        sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        priority: 'low',
        user_responded: true
      },
      {
        id: '2',
        trigger_type: 'progress_celebration',
        content: 'Fantastiskt! Du har genomfört 4 aktiviteter idag! Du är verkligen på rätt spår!',
        sent_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        priority: 'medium',
        user_responded: false
      }
    ];
    setRecentMessages(mockMessages);
  }, []);

  const handleTestProactiveMessage = async (triggerType: string) => {
    setIsAnalyzing(true);
    
    const testMessages = {
      inactivity_check: 'Detta är ett test av inaktivitets-kontroll från Stefan AI.',
      task_reminder: 'Test: Kom ihåg att slutföra dina pågående uppgifter!',
      progress_celebration: 'Test: Grattis till dina framsteg idag! 🎉',
      motivation_boost: 'Test: Du gör fantastiska framsteg på din utvecklingsresa!'
    };

    const message = testMessages[triggerType as keyof typeof testMessages] || 'Test meddelande från Stefan AI';
    
    try {
      await sendProactiveMessage(triggerType, message, 'medium');
      
      // Success - lägg till i recent messages
      const newMessage: ProactiveMessageLog = {
        id: Date.now().toString(),
        trigger_type: triggerType,
        content: message,
        sent_at: new Date().toISOString(),
        priority: 'medium',
        user_responded: false
      };
      
      setRecentMessages(prev => [newMessage, ...prev]);
      
    } catch (error) {
      console.error('Error sending test message:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFullAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      await analyzeAndSendProactiveMessages();
    } catch (error) {
      console.error('Error in full analysis:', error);
    } finally {
      setIsAnalyzing(false);
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

  const stefanConversation = conversations.find(conv => 
    conv.participants?.some(p => p.id === 'stefan-ai-system-user')
  );

  return (
    <Card className="border-purple-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Autonom Messaging</CardTitle>
              <p className="text-sm text-muted-foreground">
                Stefan skickar proaktiva meddelanden baserat på ditt beteende
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
        {/* Konversation med Stefan */}
        {stefanConversation && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Aktiv konversation med Stefan</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {stefanConversation.last_message?.content || 'Ingen meddelanden än...'}
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

        {/* Test Controls */}
        <div>
          <h3 className="text-sm font-medium mb-3">Test Proaktiva Meddelanden</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestProactiveMessage('inactivity_check')}
              disabled={isAnalyzing}
              className="justify-start"
            >
              <Clock className="h-4 w-4 mr-2" />
              Inaktivitets-check
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestProactiveMessage('progress_celebration')}
              disabled={isAnalyzing}
              className="justify-start"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Framsteg-firande
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestProactiveMessage('task_reminder')}
              disabled={isAnalyzing}
              className="justify-start"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Uppgifts-påminnelse
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendMotivationalMessage('progress_milestone')}
              disabled={isAnalyzing}
              className="justify-start"
            >
              <Heart className="h-4 w-4 mr-2" />
              Motivations-boost
            </Button>
          </div>
          
          <Button
            variant="default"
            onClick={handleFullAnalysis}
            disabled={isAnalyzing}
            className="w-full mt-3"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isAnalyzing ? 'Analyserar...' : 'Kör Full Beteende-Analys'}
          </Button>
        </div>

        {/* Recent Proactive Messages */}
        <div>
          <h3 className="text-sm font-medium mb-3">Senaste Proaktiva Meddelanden</h3>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {recentMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Inga proaktiva meddelanden än</p>
                  <p className="text-xs">Stefan kommer skicka meddelanden baserat på ditt beteende</p>
                </div>
              ) : (
                recentMessages.map((message) => (
                  <div key={message.id} className="p-3 border rounded-lg bg-background/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTriggerIcon(message.trigger_type)}
                        <span className="text-xs font-medium">
                          {message.trigger_type.replace('_', ' ')}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getPriorityColor(message.priority)}`}
                        >
                          {message.priority}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.sent_at).toLocaleTimeString('sv-SE')}
                      </span>
                    </div>
                    
                    <p className="text-sm mb-2">{message.content}</p>
                    
                    <div className="flex items-center gap-2">
                      {message.user_responded ? (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Användaren svarade
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Väntar på svar
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Analytics Overview */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h3 className="text-sm font-medium mb-2">Messaging Analytics</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-600">{recentMessages.length}</p>
              <p className="text-xs text-muted-foreground">Skickade meddelanden</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {recentMessages.filter(m => m.user_responded).length}
              </p>
              <p className="text-xs text-muted-foreground">Svar från användare</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {recentMessages.length > 0 ? 
                  Math.round((recentMessages.filter(m => m.user_responded).length / recentMessages.length) * 100) : 0
                }%
              </p>
              <p className="text-xs text-muted-foreground">Svarsfrekvens</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};