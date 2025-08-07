import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useMessagingV2 } from '@/hooks/useMessagingV2';
import { useProactiveMessaging } from '@/hooks/useProactiveMessaging';
import { useStefanInterventions } from '@/hooks/useStefanInterventions';
import { ConversationPanel } from './ConversationPanel';
import { StefanAnalyticsWidget } from './StefanAnalyticsWidget';
import { QuickActionCenter } from './QuickActionCenter';
import {
  MessageSquare,
  Brain,
  Users,
  Sparkles,
  TrendingUp,
  Zap,
  MessageCircle,
  Send,
  Star
} from 'lucide-react';

/**
 * 🎯 IMPROVED MESSAGING HUB - UX REVOLUTION
 * ✅ Single primary action for starting conversations
 * ✅ Clearer information hierarchy 
 * ✅ Better onboarding and empty states
 * ✅ Intuitive navigation flow
 * ✅ Enhanced Stefan AI integration
 */

export const ImprovedMessagingHub: React.FC = () => {
  const { user } = useAuth();
  const { conversations, totalUnreadCount, getOrCreateDirectConversation } = useMessagingV2();
  const { getOrCreateStefanConversation } = useProactiveMessaging();
  const { interventions, getInterventionStats } = useStefanInterventions();
  
  const [activeTab, setActiveTab] = useState('conversations');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Stefan conversation on first load if no conversations exist
  useEffect(() => {
    const initializeMessaging = async () => {
      if (user && !isInitialized) {
        setIsInitialized(true);
        
        // Auto-create Stefan conversation if none exists
        if (conversations.length === 0) {
          await getOrCreateStefanConversation();
        }
      }
    };
    
    initializeMessaging();
  }, [user, conversations.length, getOrCreateStefanConversation, isInitialized]);

  const stefanStats = getInterventionStats();
  const hasActiveConversations = conversations.length > 0;
  const stefanConversation = conversations.find(conv => 
    conv.participant_ids?.includes('00000000-0000-0000-0000-000000000001')
  );

  const handleStartConversation = async () => {
    await getOrCreateStefanConversation();
    setActiveTab('conversations');
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6 animate-fade-in">
      {/* 🎯 Enhanced Header with Clear Value Proposition */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="relative">
            <MessageCircle className="h-10 w-10 text-primary" />
            <div className="absolute -top-1 -right-1">
              <Sparkles className="h-4 w-4 text-yellow-500" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Meddelanden & AI Chat
          </h1>
        </div>
        
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Kommunicera med ditt team och få intelligent coaching från Stefan AI - allt samlat på ett ställe
        </p>

        {/* Quick Status Overview */}
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Stefan AI aktiv</span>
          </div>
          {totalUnreadCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="destructive">
                {totalUnreadCount} nya meddelanden
              </Badge>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>{conversations.length} aktiva konversationer</span>
          </div>
        </div>
      </div>

      {/* 🚀 Primary Action - Single Clear CTA */}
      {!hasActiveConversations && (
        <Alert className="max-w-2xl mx-auto bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
          <Brain className="h-5 w-5" />
          <AlertDescription className="space-y-3">
            <div>
              <strong>Välkommen till ditt meddelandecenter!</strong>
              <p className="text-sm mt-1">Stefan AI är redo att hjälpa dig med personlig coaching och stöd.</p>
            </div>
            <Button 
              onClick={handleStartConversation}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              <Brain className="h-4 w-4 mr-2" />
              Starta konversation med Stefan AI
              <Sparkles className="h-4 w-4 ml-2" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 📊 Enhanced Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
          <TabsTrigger value="conversations" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Meddelanden
            {totalUnreadCount > 0 && (
              <Badge variant="destructive" className="text-xs h-5 min-w-[20px]">
                {totalUnreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="stefan" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Stefan AI
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Snabbåtgärder
          </TabsTrigger>
        </TabsList>

        {/* 💬 Conversations Tab */}
        <TabsContent value="conversations" className="space-y-6">
          {hasActiveConversations ? (
            <ConversationPanel />
          ) : (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <MessageCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Inga konversationer ännu</h3>
                  <p className="text-muted-foreground mb-4">
                    Börja din utvecklingsresa genom att chatta med Stefan AI. 
                    Han kommer ge dig personliga råd och stöd baserat på dina behov.
                  </p>
                </div>
                <div className="space-y-2">
                  <Button 
                    onClick={handleStartConversation}
                    size="lg"
                    className="w-full max-w-sm mx-auto"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Börja chatta med Stefan AI
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    100% säkert och konfidentiellt
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 🧠 Stefan AI Tab */}
        <TabsContent value="stefan" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stefan Status Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  Stefan AI Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stefanConversation ? (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-800">Aktiv och redo att hjälpa</span>
                    </div>
                    <p className="text-sm text-green-700 mb-3">
                      Stefan övervakar din utveckling och kommer skicka proaktiva meddelanden när det behövs.
                    </p>
                    <Button 
                      size="sm" 
                      onClick={() => setActiveTab('conversations')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Visa konversation
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-3">
                      Stefan AI är redo att börja din personliga utvecklingsresa.
                    </p>
                    <Button 
                      onClick={handleStartConversation}
                      size="sm"
                      className="w-full"
                    >
                      Aktivera Stefan AI
                    </Button>
                  </div>
                )}

                {/* Stefan Capabilities */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Brain className="h-6 w-6 text-blue-600 mb-2" />
                    <h4 className="text-sm font-medium text-blue-800">AI Coaching</h4>
                    <p className="text-xs text-blue-600">Personliga råd baserat på din data</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600 mb-2" />
                    <h4 className="text-sm font-medium text-purple-800">Framstegsanalys</h4>
                    <p className="text-xs text-purple-600">Följer din utveckling över tid</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <Star className="h-6 w-6 text-green-600 mb-2" />
                    <h4 className="text-sm font-medium text-green-800">Proaktiv support</h4>
                    <p className="text-xs text-green-600">Når ut när du behöver stöd</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <Zap className="h-6 w-6 text-orange-600 mb-2" />
                    <h4 className="text-sm font-medium text-orange-800">Smart påminnelser</h4>
                    <p className="text-xs text-orange-600">Håller dig på rätt spår</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stefan Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Snabbåtgärder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleStartConversation}
                  className="w-full"
                  variant="outline"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chatta nu
                </Button>
                <Button 
                  onClick={() => setActiveTab('analytics')}
                  className="w-full"
                  variant="outline"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Se analytics
                </Button>
                <Button 
                  onClick={() => setActiveTab('actions')}
                  className="w-full"
                  variant="outline"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Fler åtgärder
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 📊 Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <StefanAnalyticsWidget />
        </TabsContent>

        {/* ⚡ Quick Actions Tab */}
        <TabsContent value="actions" className="space-y-6">
          <QuickActionCenter />
        </TabsContent>
      </Tabs>
    </div>
  );
};