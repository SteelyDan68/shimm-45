import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAdaptiveLearning } from '@/hooks/useAdaptiveLearning';
import { useEmotionalSupport } from '@/hooks/useEmotionalSupport';
import { useProactiveMessaging } from '@/hooks/useProactiveMessaging';
import {
  Brain,
  Heart,
  Lightbulb,
  Clock,
  Target,
  BookOpen,
  Zap,
  Smile,
  TrendingUp,
  Award,
  Eye,
  Headphones,
  MousePointer,
  FileText,
  Users
} from 'lucide-react';

/**
 * 🎓 PEDAGOGICAL AI COACH INTERFACE
 * Huvudkomponent för Fas 3 - adaptiv pedagogisk coaching
 */

export const PedagogicalCoachInterface: React.FC = () => {
  const {
    learningProfile,
    calculateOptimalSessionLength,
    suggestOptimalLearningTime,
    getPersonalizedMotivation,
    generateNeuroplasticityFeedback
  } = useAdaptiveLearning();

  const {
    emotionalState,
    socialPresence,
    generateEmpathicSupport,
    simulateSocialPresence,
    getEmotionalValidation
  } = useEmotionalSupport();

  const { sendMotivationalMessage } = useProactiveMessaging();
  const [activeMode, setActiveMode] = useState<'learning' | 'emotional' | 'social'>('learning');
  const [currentActivity, setCurrentActivity] = useState<string | null>(null);

  // Simulera en pågående aktivitet för demo
  useEffect(() => {
    if (!currentActivity) {
      setCurrentActivity('självvård_assessment');
    }
  }, [currentActivity]);

  const getLearningStyleIcon = (type: string) => {
    const icons = {
      visual: <Eye className="h-4 w-4" />,
      auditory: <Headphones className="h-4 w-4" />,
      kinesthetic: <MousePointer className="h-4 w-4" />,
      reading_writing: <FileText className="h-4 w-4" />,
      multimodal: <Users className="h-4 w-4" />
    };
    return icons[type as keyof typeof icons] || <Brain className="h-4 w-4" />;
  };

  const getMoodEmoji = (mood: string) => {
    const emojis = {
      excited: '🚀',
      motivated: '💪',
      neutral: '😊',
      frustrated: '😤',
      overwhelmed: '😰',
      confident: '✨',
      anxious: '😟'
    };
    return emojis[mood as keyof typeof emojis] || '🤖';
  };

  const handleCoachingAction = async (action: string) => {
    switch (action) {
      case 'motivational_boost':
        if (emotionalState) {
          await sendMotivationalMessage('motivation_boost');
        }
        break;
      case 'learning_adaptation':
        
        break;
      case 'emotional_support':
        if (emotionalState) {
          
        }
        break;
      case 'neuroplasticity_explanation':
        
        break;
    }
  };

  if (!learningProfile || !emotionalState) {
    return (
      <Card className="border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Brain className="h-4 w-4 text-white animate-pulse" />
            </div>
            <div>
              <p className="font-medium">Stefan analyserar din lärstil...</p>
              <p className="text-sm text-muted-foreground">Förbereder personaliserad coaching</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const empathicSupport = generateEmpathicSupport(emotionalState, currentActivity || 'general');
  const socialPresenceResponse = simulateSocialPresence();
  const optimalSessionLength = calculateOptimalSessionLength();
  const learningTimeAdvice = suggestOptimalLearningTime();
  const personalizedMotivation = getPersonalizedMotivation('current_activity');
  const neuroplasticityFeedback = generateNeuroplasticityFeedback(currentActivity || 'practice', 0.75);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Stefan - Pedagogisk AI-Coach</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Adaptiv neuroplasticitet-baserad coaching
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-white">
                Lärstil: {learningProfile.primary_learning_style.type}
              </Badge>
              <Badge variant="outline" className="bg-white">
                {getMoodEmoji(emotionalState.current_mood)} {emotionalState.current_mood}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Mode Selector */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
        <Button
          variant={activeMode === 'learning' ? 'default' : 'ghost'}
          onClick={() => setActiveMode('learning')}
          className="flex-1"
        >
          <Lightbulb className="h-4 w-4 mr-2" />
          Adaptiv Lärande
        </Button>
        <Button
          variant={activeMode === 'emotional' ? 'default' : 'ghost'}
          onClick={() => setActiveMode('emotional')}
          className="flex-1"
        >
          <Heart className="h-4 w-4 mr-2" />
          Känslomässigt Stöd
        </Button>
        <Button
          variant={activeMode === 'social' ? 'default' : 'ghost'}
          onClick={() => setActiveMode('social')}
          className="flex-1"
        >
          <Smile className="h-4 w-4 mr-2" />
          Social Närvaro
        </Button>
      </div>

      {/* Learning Mode */}
      {activeMode === 'learning' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Learning Style Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {getLearningStyleIcon(learningProfile.primary_learning_style.type)}
                Din Lärstil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{learningProfile.primary_learning_style.type}</span>
                <Badge variant="secondary">
                  {Math.round(learningProfile.primary_learning_style.confidence * 100)}% säker
                </Badge>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Karakteristiska drag:</p>
                <div className="space-y-1">
                  {learningProfile.primary_learning_style.characteristics.map((char, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      {char}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium mb-1">Optimalt sessionslängd:</p>
                <p className="text-2xl font-bold text-purple-600">{optimalSessionLength} min</p>
                <p className="text-xs text-muted-foreground">{learningTimeAdvice}</p>
              </div>
            </CardContent>
          </Card>

          {/* Neuroplasticity Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Neuroplasticitet-Indikatorer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Growth Mindset</span>
                  <span className="text-sm">
                    {Math.round(learningProfile.neuroplasticity_indicators.growth_mindset_score * 100)}%
                  </span>
                </div>
                <Progress value={learningProfile.neuroplasticity_indicators.growth_mindset_score * 100} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Resiliens</span>
                  <span className="text-sm">
                    {Math.round(learningProfile.neuroplasticity_indicators.resilience_level * 100)}%
                  </span>
                </div>
                <Progress value={learningProfile.neuroplasticity_indicators.resilience_level * 100} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Adaptabilitet</span>
                  <span className="text-sm">
                    {Math.round(learningProfile.neuroplasticity_indicators.adaptability_score * 100)}%
                  </span>
                </div>
                <Progress value={learningProfile.neuroplasticity_indicators.adaptability_score * 100} />
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium mb-1">🧠 Neuroplasticitet-Tips:</p>
                <p className="text-sm">{neuroplasticityFeedback}</p>
              </div>
            </CardContent>
          </Card>

          {/* Learning Optimization */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Personaliserad Läroptimering
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Timing</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Bästa lärperioder: {learningProfile.learning_patterns.preferred_time_of_day.join(', ')}
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-orange-800">Tempo</span>
                  </div>
                  <p className="text-sm text-orange-700">
                    Lärtakt: {learningProfile.learning_patterns.learning_pace}
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Feedback</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Föredrar: {learningProfile.learning_patterns.feedback_preference}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button onClick={() => handleCoachingAction('learning_adaptation')}>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Anpassa Lärväg
                </Button>
                <Button variant="outline" onClick={() => handleCoachingAction('neuroplasticity_explanation')}>
                  <Brain className="h-4 w-4 mr-2" />
                  Förklara Neuroplasticitet
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Emotional Support Mode */}
      {activeMode === 'emotional' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Emotionellt Tillstånd
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{getMoodEmoji(emotionalState.current_mood)}</div>
                <div>
                  <p className="font-medium capitalize">{emotionalState.current_mood}</p>
                  <p className="text-sm text-muted-foreground">
                    Konfidensgrad: {Math.round(emotionalState.confidence_level * 100)}%
                  </p>
                </div>
              </div>

              {emotionalState.stress_indicators.length > 0 && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-1">Stress-indikatorer:</p>
                  <div className="space-y-1">
                    {emotionalState.stress_indicators.map((indicator, index) => (
                      <div key={index} className="text-sm text-yellow-700">
                        • {indicator}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-1">💙 Emotional Validering:</p>
                <p className="text-sm text-blue-700">
                  {getEmotionalValidation(emotionalState.current_mood)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Empatibaserat Stöd
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <p className="text-sm font-medium mb-2">Stefan säger:</p>
                <p className="text-sm italic">"{empathicSupport.message}"</p>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    Ton: {empathicSupport.tone}
                  </Badge>
                </div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-1">Rekommenderad åtgärd:</p>
                <p className="text-sm text-green-700">{empathicSupport.recommended_action}</p>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleCoachingAction('emotional_support')}>
                  <Heart className="h-4 w-4 mr-2" />
                  Ge Stöd
                </Button>
                <Button variant="outline" onClick={() => handleCoachingAction('motivational_boost')}>
                  <Zap className="h-4 w-4 mr-2" />
                  Motivations-Boost
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Personalized Motivation */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Personaliserad Motivation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                <p className="font-medium mb-2">💪 Motivationsmeddelande anpassat för dig:</p>
                <p className="text-lg italic">"{personalizedMotivation}"</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {learningProfile.learning_patterns.motivation_triggers.map((trigger, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {trigger.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Social Presence Mode */}
      {activeMode === 'social' && socialPresenceResponse && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smile className="h-5 w-5" />
                Social Närvaro Simulation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <p className="text-sm font-medium mb-2">👋 Stefan's Hälsning:</p>
                <p className="italic">"{socialPresenceResponse.greeting}"</p>
              </div>

              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-sm font-medium text-orange-800 mb-1">Check-in:</p>
                <p className="text-sm text-orange-700">"{socialPresenceResponse.check_in}"</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(socialPresence.trust_level * 100)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Förtroendenivå</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold capitalize text-blue-600">
                    {socialPresence.relationship_stage}
                  </p>
                  <p className="text-xs text-muted-foreground">Relations-stadium</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Relationsbyggande
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-1">Föredragen stöd-stil:</p>
                <p className="text-sm text-green-700 capitalize">
                  {socialPresence.preferred_support_style}
                </p>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-1">Senaste interaktion:</p>
                <p className="text-sm text-blue-700">
                  Kändes {socialPresence.last_interaction_feeling}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Relationsbyggande aktiviteter:</p>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Heart className="h-4 w-4 mr-2" />
                  Dela personlig reflektion
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Berätta om framsteg
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Target className="h-4 w-4 mr-2" />
                  Sätt gemensamma mål
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};