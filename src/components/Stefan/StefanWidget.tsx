import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StefanInteraction } from '@/types/welcomeAssessment';
import { useStefanPersonality } from '@/hooks/useStefanPersonality';
import { STEFAN_PERSONAS } from '@/config/stefanPersonas';
import { useUserJourney } from '@/hooks/useUserJourney';
import { 
  MessageCircle, 
  Heart, 
  Lightbulb, 
  Target, 
  User,
  Sparkles,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface StefanWidgetProps {
  userId: string;
}

export const StefanWidget = ({ userId }: StefanWidgetProps) => {
  const { 
    recentInteractions, 
    createStefanInteraction, 
    getCurrentPersonaInfo,
    triggerProactiveIntervention 
  } = useStefanPersonality();
  
  const { journeyState } = useUserJourney();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showProactiveMessage, setShowProactiveMessage] = useState(false);

  // Show proactive Stefan messages based on user activity
  useEffect(() => {
    if (journeyState && recentInteractions.length === 0) {
      // First time user - show welcome message
      setTimeout(() => {
        createStefanInteraction(
          'proactive',
          'first_visit',
          {
            journey_phase: journeyState.current_phase,
            user_id: userId
          }
        );
        setShowProactiveMessage(true);
      }, 3000);
    }
  }, [journeyState, recentInteractions.length, createStefanInteraction, userId]);

  // Check for proactive interventions based on inactivity or patterns
  useEffect(() => {
    if (journeyState && journeyState.last_activity_at) {
      const lastActivity = new Date(journeyState.last_activity_at);
      const hoursSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);
      
      // Trigger gentle nudge after 24 hours of inactivity
      if (hoursSinceActivity > 24 && recentInteractions.length > 0) {
        triggerProactiveIntervention('inactivity', {
          hours_since_activity: Math.round(hoursSinceActivity),
          last_phase: journeyState.current_phase
        });
      }
    }
  }, [journeyState, triggerProactiveIntervention, recentInteractions]);

  const getPersonaIcon = (persona: string) => {
    switch (persona) {
      case 'mentor':
        return <Lightbulb className="h-4 w-4" />;
      case 'cheerleader':
        return <Heart className="h-4 w-4" />;
      case 'strategist':
        return <Target className="h-4 w-4" />;
      case 'friend':
        return <User className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getPersonaColor = (persona: string) => {
    switch (persona) {
      case 'mentor':
        return 'bg-blue-500';
      case 'cheerleader':
        return 'bg-green-500';
      case 'strategist':
        return 'bg-purple-500';
      case 'friend':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const latestInteraction = recentInteractions[0];
  const currentPersona = getCurrentPersonaInfo();

  if (!latestInteraction && !showProactiveMessage) {
    // Stefan introduction card for new users
    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-blue-500 text-white text-lg font-bold">
                S
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Möt Stefan
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Din personliga utvecklingscoach
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            Hej! Jag är Stefan, din AI-coach som kommer att följa dig genom din utvecklingsresa. 
            Jag har olika personligheter beroende på vad du behöver - ibland är jag din mentor, 
            ibland din supporter, och ibland din strategiska rådgivare.
          </p>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(STEFAN_PERSONAS).map(([key, persona]) => (
              <div key={key} className="flex items-center gap-2 p-2 bg-white rounded">
                <div className={`p-1 rounded ${getPersonaColor(key)} text-white`}>
                  {getPersonaIcon(key)}
                </div>
                <span className="font-medium">{persona.name.split(' ')[1]}</span>
              </div>
            ))}
          </div>
          
          <Button 
            onClick={() => setShowProactiveMessage(true)}
            className="w-full"
            size="sm"
          >
            Säg hej till Stefan
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className={`text-white ${getPersonaColor(latestInteraction?.stefan_persona || 'mentor')}`}>
                S
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {getPersonaIcon(latestInteraction?.stefan_persona || 'mentor')}
                Stefan {currentPersona.name.split(' ')[1] || 'Mentorn'}
              </CardTitle>
              {latestInteraction && (
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(latestInteraction.created_at), { 
                    addSuffix: true, 
                    locale: sv 
                  })}
                </p>
              )}
            </div>
          </div>
          
          {recentInteractions.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {recentInteractions.length} meddelanden
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {latestInteraction?.message_content && (
          <div className="bg-white/70 p-3 rounded-lg">
            <p className="text-sm leading-relaxed">
              {isExpanded 
                ? latestInteraction.message_content 
                : latestInteraction.message_content.substring(0, 150) + 
                  (latestInteraction.message_content.length > 150 ? '...' : '')
              }
            </p>
            
            {latestInteraction.message_content.length > 150 && !isExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="mt-2 p-0 h-auto text-blue-600"
              >
                Läs mer
              </Button>
            )}
          </div>
        )}

        {/* Quick Actions based on journey state */}
        <div className="flex gap-2">
          {journeyState?.next_recommended_assessment && (
            <Button size="sm" variant="outline" className="flex-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              Nästa bedömning
            </Button>
          )}
          
          <Button size="sm" variant="outline">
            <MessageCircle className="h-3 w-3 mr-1" />
            Chatta
          </Button>
        </div>

        {/* Show context-based tips */}
        {journeyState?.current_phase === 'welcome' && (
          <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800">
            💡 Tips: Börja med välkomstbedömningen för att få en helhetsbild av din situation
          </div>
        )}
        
        {journeyState?.current_phase === 'pillar_selection' && (
          <div className="bg-green-50 p-2 rounded text-xs text-green-800">
            🎯 Fokusera på ett pillar-område i taget för bästa resultat
          </div>
        )}
      </CardContent>
    </Card>
  );
};