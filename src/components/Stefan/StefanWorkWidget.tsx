import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStefanContext } from '@/providers/StefanContextProvider';
import { useStefanPersonality } from '@/hooks/useStefanPersonality';
import { useUserJourney } from '@/hooks/useUserJourney';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useTasks } from '@/hooks/useTasks';
import { 
  MessageCircle, 
  ChevronUp, 
  ChevronDown,
  Send,
  Lightbulb,
  Heart,
  Target,
  User,
  Sparkles,
  HelpCircle,
  TrendingUp,
  Zap,
  X,
  CheckCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

export const StefanWorkWidget = () => {
  const { user } = useAuth();
  const {
    showWidget,
    setShowWidget,
    currentPage,
    userActivity,
    triggerContextualHelp,
    askStefanQuestion,
    requestMotivation,
    isAvailable
  } = useStefanContext();
  
  const { recentInteractions, getCurrentPersonaInfo, loading } = useStefanPersonality();
  const { journeyState } = useUserJourney();
  const { tasks, loading: tasksLoading } = useTasks();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [showQuestionInput, setShowQuestionInput] = useState(false);

  const currentPersona = getCurrentPersonaInfo();
  const latestInteraction = recentInteractions[0];

  // Auto-show widget when there are new interactions
  useEffect(() => {
    if (latestInteraction && !showWidget) {
      setShowWidget(true);
    }
  }, [latestInteraction, showWidget, setShowWidget]);

  const getPersonaIcon = (persona: string) => {
    switch (persona) {
      case 'mentor': return <Lightbulb className="h-4 w-4" />;
      case 'cheerleader': return <Heart className="h-4 w-4" />;
      case 'strategist': return <Target className="h-4 w-4" />;
      case 'friend': return <User className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getPersonaColor = (persona: string) => {
    switch (persona) {
      case 'mentor': return 'bg-blue-500';
      case 'cheerleader': return 'bg-green-500';
      case 'strategist': return 'bg-purple-500';
      case 'friend': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getContextualPrompts = () => {
    const page = currentPage.split('/')[1] || 'dashboard';
    const prompts = [];

    switch (page) {
      case 'tasks':
        prompts.push(
          { text: 'Hjälp mig prioritera', action: () => triggerContextualHelp('task_prioritization') },
          { text: 'Jag har kört fast', action: () => triggerContextualHelp('task_stuck') },
          { text: 'Motivera mig', action: () => requestMotivation('task_motivation') }
        );
        break;
      case 'calendar':
        prompts.push(
          { text: 'Planera min vecka', action: () => triggerContextualHelp('weekly_planning') },
          { text: 'Förbered inför möte', action: () => triggerContextualHelp('meeting_preparation') }
        );
        break;
      case 'client-dashboard':
        prompts.push(
          { text: 'Översikt av framsteg', action: () => triggerContextualHelp('progress_overview') },
          { text: 'Nästa steg?', action: () => triggerContextualHelp('next_steps') }
        );
        break;
      default:
        prompts.push(
          { text: 'Vad ska jag göra nu?', action: () => triggerContextualHelp('general_guidance') },
          { text: 'Uppmuntran tack', action: () => requestMotivation() }
        );
    }

    return prompts;
  };

  const handleAskQuestion = async () => {
    if (!questionText.trim()) return;
    
    await askStefanQuestion(questionText, currentPage);
    setQuestionText('');
    setShowQuestionInput(false);
    setIsExpanded(true);
  };

  if (!isAvailable || !showWidget) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm max-h-[calc(100vh-6rem)] flex flex-col">
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50/95 to-indigo-50/95 backdrop-blur-sm shadow-lg flex flex-col max-h-full">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          {/* Stefan Header - Always Visible */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={`text-white ${getPersonaColor(currentPersona?.id || 'mentor')}`}>
                    S
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    {getPersonaIcon(currentPersona?.id || 'mentor')}
                    <span className="font-semibold text-sm">Stefan</span>
                    <Badge variant="secondary" className="text-xs">
                      {currentPersona?.name.split(' ')[1] || 'Mentor'}
                    </Badge>
                  </div>
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
              
              <div className="flex items-center gap-1">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={() => setShowWidget(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick Message Preview */}
            {latestInteraction && !isExpanded && (
              <div className="mt-2 p-2 bg-white/70 rounded text-xs">
                {latestInteraction.message_content.substring(0, 60)}...
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 h-auto ml-1 text-blue-600"
                  onClick={() => setIsExpanded(true)}
                >
                  läs mer
                </Button>
              </div>
            )}
          </div>

          <CollapsibleContent className="flex-1 min-h-0">
            <ScrollArea className="max-h-[60vh]">
              <CardContent className="pt-0 space-y-4">
                {/* Latest Stefan Message */}
                {latestInteraction && (
                  <div className="bg-white/70 p-3 rounded-lg">
                    <p className="text-sm leading-relaxed">
                      {latestInteraction.message_content.length > 300 
                        ? `${latestInteraction.message_content.substring(0, 300)}...` 
                        : latestInteraction.message_content}
                    </p>
                  </div>
                )}

              {/* Contextual Quick Actions */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Snabba åtgärder:</p>
                <div className="grid grid-cols-1 gap-2">
                  {getContextualPrompts().map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs h-8"
                      onClick={prompt.action}
                      disabled={loading}
                    >
                      <Sparkles className="h-3 w-3 mr-2" />
                      {prompt.text}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Journey Context Card */}
              {journeyState && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800 mb-2">
                    <Target className="h-4 w-4" />
                    <span className="text-xs font-medium">Din resa</span>
                  </div>
                  <div className="space-y-1 text-xs text-blue-700">
                    <p>Fas: <span className="font-medium">{journeyState.current_phase}</span></p>
                    <p>Framsteg: <span className="font-medium">{journeyState.journey_progress}%</span></p>
                    {journeyState.next_recommended_assessment && (
                      <p>Nästa: <span className="font-medium">{journeyState.next_recommended_assessment}</span></p>
                    )}
                  </div>
                </div>
              )}

              {/* Task Context Card */}
              {tasks && !tasksLoading && (
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-800 mb-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Uppgifter idag</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-700">
                    <p>Aktiva: <span className="font-medium">{tasks.filter(t => t.status === 'planned' || t.status === 'in_progress').length}</span></p>
                    <p>Klara: <span className="font-medium">{tasks.filter(t => t.status === 'completed').length}</span></p>
                    {tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length > 0 && (
                      <p className="text-red-600">Hög prioritet: <span className="font-medium">{tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length}</span></p>
                    )}
                  </div>
                </div>
              )}

              {/* Struggling Task Alert */}
              {userActivity.strugglingTasks.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-800">
                    <Zap className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      {userActivity.strugglingTasks.length} uppgift{userActivity.strugglingTasks.length > 1 ? 'er' : ''} behöver hjälp
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 p-0 h-auto text-amber-700"
                    onClick={() => triggerContextualHelp('struggling_tasks', { tasks: userActivity.strugglingTasks })}
                  >
                    Få hjälp →
                  </Button>
                </div>
              )}

              {/* Question Input */}
              {showQuestionInput ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ställ en fråga till Stefan..."
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                      className="text-sm"
                    />
                    <Button size="sm" onClick={handleAskQuestion} disabled={!questionText.trim() || loading}>
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setShowQuestionInput(false)}
                  >
                    Avbryt
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setShowQuestionInput(true)}
                >
                  <HelpCircle className="h-3 w-3 mr-2" />
                  Ställ en fråga
                </Button>
              )}

              {/* Progress Encouragement */}
              {userActivity.currentStreak > 0 && (
                <div className="bg-green-50 border border-green-200 p-2 rounded text-center">
                  <div className="flex items-center justify-center gap-1 text-green-800">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-xs font-medium">
                      {userActivity.currentStreak} uppgifter klara! 🎉
                    </span>
                  </div>
                </div>
               )}
              </CardContent>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};