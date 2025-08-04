import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEnhancedStefanContext } from '@/providers/EnhancedStefanContextProvider';
import { 
  MessageCircle, 
  Brain, 
  TrendingUp, 
  Heart, 
  Lightbulb,
  X,
  Minimize2,
  Maximize2,
  Activity,
  Clock,
  Target
} from 'lucide-react';
// Enhanced animations with CSS transitions

interface StefanWidgetProps {
  className?: string;
}

export const EnhancedStefanWidget: React.FC<StefanWidgetProps> = ({ className = '' }) => {
  const {
    isAvailable,
    currentPersona,
    contextualMood,
    userActivity,
    triggerContextualHelp,
    askStefanQuestion,
    celebrateProgress,
    requestMotivation,
    suggestNextAction,
    showWidget,
    setShowWidget
  } = useEnhancedStefanContext();

  const [isMinimized, setIsMinimized] = useState(false);
  const [currentInsight, setCurrentInsight] = useState<any>(null);
  const [showMoodIndicator, setShowMoodIndicator] = useState(true);

  // Rotate through insights
  useEffect(() => {
    if (userActivity.contextualInsights?.length > 0) {
      const interval = setInterval(() => {
        const randomInsight = userActivity.contextualInsights[
          Math.floor(Math.random() * userActivity.contextualInsights.length)
        ];
        setCurrentInsight(randomInsight);
      }, 15000); // Change insight every 15 seconds

      return () => clearInterval(interval);
    }
  }, [userActivity.contextualInsights]);

  // Get mood-specific styling
  const getMoodStyling = () => {
    switch (contextualMood) {
      case 'celebratory':
        return {
          bgClass: 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200',
          iconColor: 'text-yellow-600',
          accentColor: 'text-orange-600'
        };
      case 'supportive':
        return {
          bgClass: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200',
          iconColor: 'text-blue-600',
          accentColor: 'text-indigo-600'
        };
      case 'encouraging':
        return {
          bgClass: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200',
          iconColor: 'text-green-600',
          accentColor: 'text-emerald-600'
        };
      case 'analytical':
        return {
          bgClass: 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200',
          iconColor: 'text-purple-600',
          accentColor: 'text-violet-600'
        };
      default:
        return {
          bgClass: 'bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200',
          iconColor: 'text-slate-600',
          accentColor: 'text-gray-600'
        };
    }
  };

  const styling = getMoodStyling();

  if (!showWidget || !isAvailable) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${className}`}>
        <Card className={`w-80 shadow-lg border-2 ${styling.bgClass} ${isMinimized ? 'h-auto' : ''}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="animate-pulse">
                  <Brain className={`h-5 w-5 ${styling.iconColor}`} />
                </div>
                <CardTitle className="text-sm font-semibold">
                  Stefan AI Coach
                </CardTitle>
                {showMoodIndicator && (
                  <Badge variant="outline" className={`text-xs ${styling.accentColor} border-current`}>
                    {contextualMood === 'celebratory' && '🎉'}
                    {contextualMood === 'supportive' && '🤗'}
                    {contextualMood === 'encouraging' && '💪'}
                    {contextualMood === 'analytical' && '🧠'}
                    {contextualMood}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-6 w-6 p-0 hover:bg-white/50"
                >
                  {isMinimized ? (
                    <Maximize2 className="h-3 w-3" />
                  ) : (
                    <Minimize2 className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWidget(false)}
                  className="h-6 w-6 p-0 hover:bg-white/50"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {!isMinimized && (
            <CardContent className="space-y-3">
              {/* Context Awareness Display */}
              <div className="bg-white/50 rounded-md p-2 text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-3 w-3 text-gray-500" />
                  <span className="font-medium">Kontext-medvetenhet</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Session: {userActivity.sessionId.slice(-6)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    <span>Streak: {userActivity.currentStreak}</span>
                  </div>
                </div>
              </div>

              {/* Current Insight */}
              {currentInsight && (
                <div className="bg-white/70 rounded-md p-2 transition-all duration-300">
                  <div className="flex items-start gap-2">
                    <Lightbulb className={`h-4 w-4 mt-0.5 ${styling.iconColor}`} />
                    <div>
                      <h4 className="text-xs font-medium text-gray-800">
                        {currentInsight.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {currentInsight.description?.substring(0, 100)}...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700 mb-2">
                  Vad kan jag hjälpa dig med?
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => triggerContextualHelp('widget_help_request', { source: 'quick_action' })}
                    className="text-xs h-8 bg-white/50 hover:bg-white/70"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Hjälp
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => requestMotivation('widget_motivation')}
                    className="text-xs h-8 bg-white/50 hover:bg-white/70"
                  >
                    <Heart className="h-3 w-3 mr-1" />
                    Motivation
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={suggestNextAction}
                  className="w-full text-xs h-8 bg-white/50 hover:bg-white/70"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Föreslå nästa steg
                </Button>
              </div>

              {/* Struggling Tasks Alert */}
              {userActivity.strugglingTasks.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-2 transition-all duration-300">
                  <div className="text-xs">
                    <span className="font-medium text-amber-800">
                      {userActivity.strugglingTasks.length} uppgift{userActivity.strugglingTasks.length !== 1 ? 'er' : ''} behöver uppmärksamhet
                    </span>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => triggerContextualHelp('struggling_tasks_help', { 
                        tasks: userActivity.strugglingTasks 
                      })}
                      className="text-xs p-0 h-auto ml-1 text-amber-700 hover:text-amber-900"
                    >
                      Hjälp mig
                    </Button>
                  </div>
                </div>
              )}

              {/* Persona Info */}
              <div className="text-center text-xs text-gray-500 mt-2">
                <span>Stefan som {currentPersona} • Kontext-driven AI</span>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
  );
};