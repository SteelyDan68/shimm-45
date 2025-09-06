/**
 * 🎯 UNIFIED STEFAN INTERFACE - SPRINT 1 KRITISK FIX
 * Ersätter fragmenterade Stefan interfaces med en unified experience
 * Integrerar chat, interventions och pedagogisk coaching i one interface
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useStefanInterventions } from '@/hooks/useStefanInterventions';
import { UnifiedStefanOrchestrator, StefanContext } from '@/services/UnifiedStefanOrchestrator';
import { 
  Brain, 
  Send, 
  Target, 
  MessageSquare,
  Zap,
  Clock,
  CheckCircle,
  BookOpen,
  TrendingUp,
  Activity,
  Filter
} from 'lucide-react';

interface UnifiedStefanMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  memoryFragmentsUsed?: number;
  contextUsed?: string[];
  interventionTriggered?: boolean;
  pedagogicalElements?: string[];
}

interface UnifiedStefanInterfaceProps {
  className?: string;
  context?: 'coaching' | 'assessment' | 'planning' | 'general';
  onCoachingAction?: (action: string, data: any) => void;
}

export function UnifiedStefanInterface({ 
  className = '',
  context = 'general',
  onCoachingAction 
}: UnifiedStefanInterfaceProps) {
  const [messages, setMessages] = useState<UnifiedStefanMessage[]>([
    {
      id: '1',
      content: getStefanWelcomeMessage(context),
      isUser: false,
      timestamp: new Date()
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [selectedTab, setSelectedTab] = useState('chat');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Stefan interventions integration
  const {
    interventions,
    createIntervention,
    getFilteredInterventions,
    getInterventionStats,
    loading: interventionsLoading
  } = useStefanInterventions();

  function getStefanWelcomeMessage(context: string): string {
    const contextMessages = {
      coaching: 'Hej! Jag är Stefan, din AI-coach. Jag hjälper dig utvecklas genom neuroplasticitets-baserade metoder och personlig vägledning. Vad kan jag hjälpa dig med idag?',
      assessment: 'Hej! Jag är Stefan och specialiserar mig på att tolka och transformera dina bedömningsresultat till konkreta utvecklingsplaner. Hur mår du efter din senaste assessment?',
      planning: 'Hej! Jag är Stefan och hjälper dig skapa effektiva utvecklingsplaner baserade på neuroplasticitet. Låt oss bygga din personliga utvecklingsväg tillsammans!',
      general: 'Hej! Jag är Stefan, din personliga AI-coach. Jag kombinerar neuroplasticitet, coaching-psykologi och din unika situation för att hjälpa dig utvecklas. Vad funderar du på?'
    };
    
    return contextMessages[context] || contextMessages.general;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * 🚀 UNIFIED MESSAGE SENDING - Through Stefan Orchestrator
   */
  const sendMessage = async (message?: string) => {
    const messageToSend = message || inputMessage.trim();
    if (!messageToSend || isProcessing || !user) return;

    setInputMessage('');
    setIsProcessing(true);

    // Add user message immediately
    const userMessage: UnifiedStefanMessage = {
      id: Date.now().toString(),
      content: messageToSend,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Build Stefan context
      const stefanContext: StefanContext = {
        userId: user.id,
        conversationHistory: messages
          .slice(-5) // Last 5 messages for context
          .map(m => ({ role: m.isUser ? 'user' : 'assistant', content: m.content }))
      };

      // Process through Unified Stefan Orchestrator
      const stefanResponse = await UnifiedStefanOrchestrator.processStefanInteraction(
        messageToSend,
        stefanContext,
        context === 'coaching' ? 'coaching_analysis' : 'chat'
      );

      // Add Stefan's response
      const assistantMessage: UnifiedStefanMessage = {
        id: (Date.now() + 1).toString(),
        content: stefanResponse.message,
        isUser: false,
        timestamp: new Date(),
        memoryFragmentsUsed: stefanResponse.memoryFragmentsUsed,
        contextUsed: stefanResponse.contextUsed,
        interventionTriggered: stefanResponse.interventionCreated,
        pedagogicalElements: stefanResponse.coachingStrategy?.nextInterventions
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If coaching strategy was created, show feedback
      if (stefanResponse.coachingStrategy) {
        toast({
          title: "🎯 Coaching-strategi skapad",
          description: "Stefan har skapat en personlig coaching-plan för dig",
          duration: 5000
        });
      }

    } catch (error) {
      console.error('Stefan Unified Interface error:', error);
      
      // Error recovery message
      const errorMessage: UnifiedStefanMessage = {
        id: (Date.now() + 2).toString(),
        content: "Ursäkta, jag upplever tekniska problem just nu. Jag försöker igen om en stund. Ditt meddelande har noterats!",
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Stefan temporärt otillgänglig",
        description: "Ditt meddelande har noterats. Stefan återkommer snart!",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 🎯 QUICK ACTIONS - Contextual action buttons
   */
  const quickActions = {
    coaching: [
      'Hjälp mig förstå mina assessment-resultat',
      'Skapa en utvecklingsplan för mig',
      'Vad är mina starkaste utvecklingsområden?'
    ],
    assessment: [
      'Förklara mina bedömningsresultat',
      'Vilka är mina nästa steg?',
      'Hur kan jag förbättra mina svagaste områden?'
    ],
    planning: [
      'Skapa en 30-dagars utvecklingsplan',
      'Hjälp mig prioritera mina mål',
      'Vilka micro-habits ska jag börja med?'
    ],
    general: [
      'Visa mitt utvecklingsläge',
      'Ge mig motiverande feedback',
      'Vad ska jag fokusera på idag?'
    ]
  };

  const interventionStats = getInterventionStats();
  const todayInterventions = getFilteredInterventions('today');

  return (
    <Card className={`border-purple-200 shadow-lg ${className}`}>
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Stefan AI - Unified Coach</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {context === 'coaching' && 'Coaching & Utvecklingsspecialist'}
                {context === 'assessment' && 'Assessment & Analysexpert'}  
                {context === 'planning' && 'Utvecklingsplanerare'}
                {context === 'general' && 'Personlig AI-Coach'}
              </p>
            </div>
          </div>
          
          {todayInterventions.length > 0 && (
            <Badge variant="outline" className="bg-purple-50">
              {todayInterventions.length} meddelanden idag
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="w-full grid grid-cols-3 bg-gray-50">
            <TabsTrigger value="chat" className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="interventions" className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Interventioner ({interventionStats.total})
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Insikter
            </TabsTrigger>
          </TabsList>

          {/* CHAT TAB - Main conversation */}
          <TabsContent value="chat" className="m-0">
            <div className="h-96 flex flex-col">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-lg text-sm ${
                          message.isUser
                            ? 'bg-primary text-white'
                            : 'bg-muted border border-purple-100'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        
                        {/* Pedagogical elements highlighting */}
                        {message.pedagogicalElements && message.pedagogicalElements.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-purple-200 border-opacity-30">
                            <p className="text-xs font-medium mb-1 flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              Utvecklingsfokus:
                            </p>
                            <div className="space-y-1">
                              {message.pedagogicalElements.map((element, index) => (
                                <div key={index} className="flex items-center gap-1 text-xs">
                                  <Target className="h-2 w-2" />
                                  <span>{element}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-opacity-20">
                          <p className={`text-xs ${
                            message.isUser ? 'text-white/70' : 'text-muted-foreground'
                          }`}>
                            {message.timestamp.toLocaleTimeString('sv-SE', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                          <div className="flex items-center gap-2">
                            {message.interventionTriggered && (
                              <Badge variant="secondary" className="text-xs bg-purple-50">
                                <Zap className="h-2 w-2 mr-1" />
                                Intervention skapad
                              </Badge>
                            )}
                            {message.memoryFragmentsUsed && message.memoryFragmentsUsed > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {message.memoryFragmentsUsed} minnen
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-muted p-3 rounded-lg text-sm border border-purple-100 max-w-[85%]">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <span className="text-muted-foreground ml-2">Stefan analyserar och svarar...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>
              
              {/* Input area */}
              <div className="p-4 border-t bg-background">
                {/* Quick actions */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {quickActions[context].map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => sendMessage(action)}
                      disabled={isProcessing}
                      className="text-xs h-6 px-2 hover:bg-purple-50"
                    >
                      {action}
                    </Button>
                  ))}
                </div>
                
                <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={`Fråga Stefan om ${context === 'coaching' ? 'coaching' : context === 'assessment' ? 'bedömningar' : 'utveckling'}...`}
                    disabled={isProcessing}
                    className="flex-1 border-purple-200 focus:border-purple-400"
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={isProcessing || !inputMessage.trim()}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </TabsContent>

          {/* INTERVENTIONS TAB - Stefan's proactive messages */}
          <TabsContent value="interventions" className="m-0">
            <div className="p-4 space-y-4 h-96">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Stefan's Meddelanden
                </h3>
                <Badge variant="secondary">
                  {interventionStats.responseRate}% svarsfrekvens
                </Badge>
              </div>
              
              <ScrollArea className="h-80">
                <div className="space-y-3">
                  {interventionsLoading ? (
                    <div className="text-center py-8">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Laddar meddelanden...</p>
                    </div>
                  ) : interventions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Inga meddelanden än</p>
                      <p className="text-xs">Stefan kommer skicka meddelanden baserat på din utveckling</p>
                    </div>
                  ) : (
                    interventions.slice(0, 10).map((intervention) => (
                      <div key={intervention.id} className="p-3 border border-purple-100 rounded-lg bg-gradient-to-r from-purple-50/30 to-pink-50/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {intervention.trigger_type === 'assessment_completion' && <CheckCircle className="h-3 w-3 text-green-500" />}
                            {intervention.trigger_type === 'inactivity_check' && <Clock className="h-3 w-3 text-orange-500" />}
                            {intervention.trigger_type === 'progress_celebration' && <Target className="h-3 w-3 text-purple-500" />}
                            <span className="text-xs font-medium capitalize">
                              {intervention.trigger_type.replace('_', ' ')}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {intervention.priority}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(intervention.created_at).toLocaleDateString('sv-SE')}
                          </span>
                        </div>
                        
                        <p className="text-sm mb-2">{intervention.content}</p>
                        
                        {intervention.user_responded ? (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Svarade: {new Date(intervention.responded_at!).toLocaleString('sv-SE')}
                          </Badge>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => sendMessage(`Svar på: ${intervention.content}`)}
                            className="text-xs h-6"
                          >
                            Svara Stefan
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* INSIGHTS TAB - Stefan's analytics and progress */}
          <TabsContent value="insights" className="m-0">
            <div className="p-4 space-y-4 h-96">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Stefan's Utvecklingsinsikter
              </h3>
              
              {/* Key metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{interventionStats.total}</p>
                  <p className="text-xs text-muted-foreground">Totala meddelanden</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{interventionStats.responded}</p>
                  <p className="text-xs text-muted-foreground">Svar från dig</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{interventionStats.avgEffectiveness.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Effektivitet</p>
                </div>
              </div>
              
              {/* Coaching effectiveness */}
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Stefan's Coaching Effektivitet</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Svarsfrekvens:</span>
                    <span className="font-medium">{interventionStats.responseRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Brådskande meddelanden:</span>
                    <span className="font-medium text-red-600">{interventionStats.priorityStats.urgent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Höga prioritet:</span>
                    <span className="font-medium text-orange-600">{interventionStats.priorityStats.high}</span>
                  </div>
                </div>
              </div>

              {/* Recent insights placeholder - to be enhanced in Sprint 2 */}
              <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  Kommande Förbättringar (Sprint 2)
                </h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>• Pillar-baserade coaching-insights</p>
                  <p>• Neuroplasticitets-progress tracking</p>
                  <p>• Personaliserade utvecklingsrekommendationer</p>
                  <p>• Adaptive coaching-strategier</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}