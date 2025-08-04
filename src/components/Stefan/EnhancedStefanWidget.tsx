import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useContextEngine } from '@/hooks/useContextEngine';
import { useUserJourney } from '@/hooks/useUserJourney';
import { useProactiveMessaging } from '@/hooks/useProactiveMessaging';
import { PredictiveInsightsWidget } from './PredictiveInsightsWidget';
import {
  Brain,
  MessageSquare,
  Lightbulb,
  Target,
  AlertCircle,
  Clock,
  X,
  Minimize2,
  Maximize2,
  Settings,
  Zap
} from 'lucide-react';

/**
 * 🤖 ENHANCED STEFAN WIDGET (Fixed Version)
 * Nu utan dependency på EnhancedStefanContext som orsakade runtime-fel
 */

interface MoodIndicatorProps {
  mood: string;
}

const MoodIndicator: React.FC<MoodIndicatorProps> = ({ mood }) => {
  const moodEmoji = {
    encouraging: '😊',
    supportive: '🤗',
    analytical: '🤔',
    celebratory: '🎉',
    concerned: '😟'
  };

  return (
    <span className="text-xs">
      {moodEmoji[mood as keyof typeof moodEmoji] || '🤖'}
    </span>
  );
};

export const EnhancedStefanWidget: React.FC = () => {
  const { insights, currentSessionState } = useContextEngine();
  const { journeyState } = useUserJourney();
  const { sendMotivationalMessage } = useProactiveMessaging();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showDetailed, setShowDetailed] = useState(false);
  const [activeTab, setActiveTab] = useState<'insights' | 'predictions'>('insights');
  const [currentMood, setCurrentMood] = useState('encouraging');

  // Simulate context insights based on journey state
  const sessionInsights = [
    {
      title: 'Bra framsteg idag',
      description: 'Du har varit aktiv i systemet i 15 minuter'
    },
    {
      title: 'Nästa steg föreslaget',
      description: 'Kanske dags att slutföra din assessment?'
    }
  ];

  const contextualRecommendations = [
    'Ta en paus och reflektera över dina mål',
    'Gör en snabb självvårds-check',
    'Planera veckans utvecklingsaktiviteter'
  ];

  const proactiveMessage = journeyState ? 
    `Du har kommit ${journeyState.journey_progress}% på din resa!` : 
    'Välkommen! Låt oss börja din utvecklingsresa.';

  const getStatusMessage = () => {
    if (!journeyState) return 'Initierar coaching-session...';
    
    if (journeyState.journey_progress < 20) {
      return 'Hjälper dig komma igång';
    } else if (journeyState.journey_progress < 50) {
      return 'Följer dina framsteg';
    } else if (journeyState.journey_progress < 80) {
      return 'Stöttar din utveckling';
    } else {
      return 'Firar din framgång!';
    }
  };

  // Update mood based on user activity and progress
  useEffect(() => {
    if (!journeyState) return;

    if (journeyState.journey_progress > 70) {
      setCurrentMood('celebratory');
    } else if (journeyState.journey_progress > 40) {
      setCurrentMood('encouraging');
    } else {
      setCurrentMood('supportive');
    }
  }, [journeyState]);

  // Stefan AI är alltid tillgänglig för autentiserade användare

  // Minimized state
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
        >
          <Brain className="h-5 w-5 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="shadow-lg border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-1">
                  Stefan AI
                  <MoodIndicator mood={currentMood} />
                </h3>
                <p className="text-xs text-muted-foreground">
                  {getStatusMessage()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetailed(!showDetailed)}
                className="h-6 w-6 p-0"
              >
                {showDetailed ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Navigation Tabs for Detailed View */}
          {showDetailed && (
            <div className="flex gap-1 bg-background/50 rounded-lg p-1">
              <Button
                variant={activeTab === 'insights' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('insights')}
                className="flex-1 text-xs h-7"
              >
                <Lightbulb className="h-3 w-3 mr-1" />
                Insikter
              </Button>
              <Button
                variant={activeTab === 'predictions' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('predictions')}
                className="flex-1 text-xs h-7"
              >
                <Zap className="h-3 w-3 mr-1" />
                Prediktioner
              </Button>
            </div>
          )}

          {/* Quick Insight or Proactive Message */}
          {!showDetailed && (
            <div className="p-2 bg-background/50 rounded border text-xs">
              <p className="font-medium text-purple-700">💬 {proactiveMessage}</p>
            </div>
          )}

          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-8"
              onClick={() => window.location.href = '/messages'}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Chatta
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-8"
              onClick={() => sendMotivationalMessage('motivation_boost')}
            >
              <Target className="h-3 w-3 mr-1" />
              Tips
            </Button>
          </div>

          {/* Expanded Details */}
          {showDetailed && (
            <div className="space-y-3 border-t pt-3">
              {activeTab === 'insights' && (
                <>
                  {/* Session Insights */}
                  {sessionInsights.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" />
                        Session Insights
                      </h4>
                      <div className="space-y-1">
                        {sessionInsights.slice(0, 3).map((insight, index) => (
                          <div key={index} className="text-xs p-2 bg-background/50 rounded border">
                            <p className="font-medium">{insight.title}</p>
                            <p className="text-muted-foreground">{insight.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Context Insights */}
                  {insights.slice(0, 2).map((insight, index) => (
                    <div key={index} className="text-xs p-2 bg-background/50 rounded border">
                      <div className="flex items-center gap-1 mb-1">
                        <Badge variant="outline" className="text-xs">
                          AI Insight
                        </Badge>
                        <span className="text-muted-foreground">
                          {new Date().toLocaleTimeString('sv-SE', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <p className="font-medium">Coaching Insight #{index + 1}</p>
                      <p className="text-muted-foreground">Stefan analyserar ditt beteende...</p>
                    </div>
                  ))}

                  {/* Contextual Recommendations */}
                  {contextualRecommendations.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        Rekommendationer
                      </h4>
                      <div className="space-y-1">
                        {contextualRecommendations.slice(0, 3).map((rec, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-xs h-8 bg-background/50"
                            onClick={() => sendMotivationalMessage('learning_opportunity')}
                          >
                            <Target className="h-3 w-3 mr-1" />
                            {rec}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'predictions' && (
                <div className="h-64 overflow-y-auto">
                  <PredictiveInsightsWidget />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};