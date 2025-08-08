import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ActionTooltip } from '@/components/ui/action-tooltip';
import { useToast } from '@/hooks/use-toast';
import { useLiveDevelopmentPlan } from '@/hooks/useLiveDevelopmentPlan';
import { useLiveCalendarIntegration } from '@/hooks/useLiveCalendarIntegration';
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  Zap,
  Brain,
  Heart,
  RefreshCw,
  ArrowRight,
  Star
} from 'lucide-react';

interface DevelopmentStrategy {
  id: string;
  type: 'habit' | 'action' | 'mindset' | 'skill';
  title: string;
  description: string;
  pillarKey: string;
  estimatedTime: number;
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  neuroplasticPrinciple: string;
  isCompleted: boolean;
  scheduledFor?: Date;
}

interface FocusArea {
  pillarKey: string;
  pillarName: string;
  currentLevel: number;
  targetLevel: number;
  priority: 1 | 2 | 3;
  strategies: DevelopmentStrategy[];
  color: string;
  icon: React.ReactNode;
}

interface PersonalDevelopmentPlanProps {
  userId: string;
  assessmentData: any[];
}

export const PersonalDevelopmentPlanViewer: React.FC<PersonalDevelopmentPlanProps> = ({
  userId,
  assessmentData
}) => {
  const { toast } = useToast();
  
  // Use live development plan hook
  const {
    developmentPlan,
    strategies,
    isLoading,
    isGenerating,
    generateDevelopmentPlan,
    toggleStrategyCompletion,
    scheduleStrategy
  } = useLiveDevelopmentPlan(userId, assessmentData);

  // Use live calendar integration
  const {
    createCalendarEvent,
    scheduleActionableToCalendar
  } = useLiveCalendarIntegration(userId);

  const handleAICoaching = async () => {
    try {
      toast({
        title: "🤖 AI-Coaching startar...",
        description: "Analyserar dina assessments och skapar personliga rekommendationer",
      });

      // Generate new development plan based on assessments
      await generateDevelopmentPlan();
      
      toast({
        title: "✨ AI-Coaching slutförd!",
        description: "Din utvecklingsplan har uppdaterats med nya strategier baserat på neuroplastiska principer",
      });
    } catch (error) {
      console.error('Error in AI coaching:', error);
      toast({
        title: "Fel",
        description: "AI-coaching kunde inte slutföras",
        variant: "destructive"
      });
    }
  };

  const handleViewInCalendar = () => {
    // Navigate to calendar with development plan context
    window.location.href = '/calendar?context=development-plan';
    
    toast({
      title: "📅 Öppnar kalender",
      description: "Visar dina schemalagda utvecklingsaktiviteter",
    });
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-700';
      case 2: return 'bg-blue-100 text-blue-700';
      case 3: return 'bg-yellow-100 text-yellow-700';
      case 4: return 'bg-orange-100 text-orange-700';
      case 5: return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: DevelopmentStrategy['type']) => {
    switch (type) {
      case 'habit': return <Clock className="w-4 h-4" />;
      case 'action': return <Zap className="w-4 h-4" />;
      case 'mindset': return <Brain className="w-4 h-4" />;
      case 'skill': return <Star className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 animate-pulse text-blue-600" />
            Laddar din utvecklingsplan...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={33} className="h-3" />
            <p className="text-muted-foreground text-center">
              Hämtar din personliga utvecklingsplan från databasen...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isGenerating) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 animate-pulse text-blue-600" />
            AI skapar din personliga utvecklingsplan...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={66} className="h-3" />
            <p className="text-muted-foreground text-center">
              Analyserar dina assessments och identifierar optimala utvecklingsstrategier...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!developmentPlan || !developmentPlan.focusAreas || developmentPlan.focusAreas.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-6 h-6" />
            Din Personliga Utvecklingsplan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Utvecklingsplan väntar på fler assessments</h3>
            <p className="text-muted-foreground mb-6">
              Genomför minst 2-3 pillar-bedömningar för att få en komplett utvecklingsplan
            </p>
            <Button onClick={() => window.location.href = '/six-pillars'}>
              Fortsätt med assessments
            </Button>
            {assessmentData.length >= 2 && (
              <Button 
                variant="outline" 
                onClick={generateDevelopmentPlan}
                disabled={isGenerating}
                className="ml-2"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Skapa plan nu
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Overview */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            Din Personliga Utvecklingsplan
            <ActionTooltip content="Baserad på dina pillar-assessments och AI-analys av dina utvecklingsområden">
              <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center text-xs text-blue-600 font-semibold cursor-help">i</div>
            </ActionTooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{developmentPlan.focusAreas.length}</div>
              <div className="text-sm text-muted-foreground">Fokusområden</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {strategies.length}
              </div>
              <div className="text-sm text-muted-foreground">Strategier</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{Math.round(developmentPlan.progressPercentage)}%</div>
              <div className="text-sm text-muted-foreground">Genomfört</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Framsteg</span>
              <span>{Math.round(developmentPlan.progressPercentage)}%</span>
            </div>
            <Progress value={developmentPlan.progressPercentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Focus Areas */}
      {developmentPlan.focusAreas.map((area, areaIndex) => (
        <Card key={area.pillarKey} className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${area.color}`}>
              {area.icon}
              {area.pillarName}
              <Badge variant="secondary" className="ml-2">
                Prioritet {area.priority}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Nuvarande: {area.currentLevel}/10</span>
              <ArrowRight className="w-4 h-4" />
              <span>Mål: {area.targetLevel}/10</span>
            </div>
            <Progress 
              value={(area.currentLevel / 10) * 100} 
              className="h-2"
            />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {area.strategies.map((strategy) => (
                <div
                  key={strategy.id}
                  className={`p-4 border rounded-lg transition-all ${
                    strategy.isCompleted 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleStrategyCompletion(strategy.id)}
                      className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        strategy.isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {strategy.isCompleted && <CheckCircle className="w-4 h-4" />}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className={`font-semibold ${strategy.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {strategy.title}
                        </h4>
                        <div className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(strategy.difficultyLevel)}`}>
                          {getTypeIcon(strategy.type)}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {strategy.estimatedTime} min
                        </Badge>
                      </div>
                      
                      <p className={`text-sm mb-2 ${strategy.isCompleted ? 'text-muted-foreground' : ''}`}>
                        {strategy.description}
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Brain className="w-3 h-3" />
                        <span>{strategy.neuroplasticPrinciple}</span>
                      </div>
                      
                      {strategy.scheduledFor && (
                        <div className="flex items-center gap-2 text-xs text-blue-600 mt-2">
                          <Calendar className="w-3 h-3" />
                          <span>Schemalagt: {strategy.scheduledFor.toLocaleDateString('sv-SE')}</span>
                        </div>
                      )}

                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const today = new Date();
                            scheduleStrategy(strategy.id, today);
                          }}
                          className="text-xs"
                        >
                          <Calendar className="w-3 h-3 mr-1" />
                          Schemalägg
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleAICoaching}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={isGenerating}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Förbättra planen med AI-coaching
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleViewInCalendar}
              className="flex-1"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Se i kalender
            </Button>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Brain className="h-4 w-4" />
                <span className="font-medium">AI-Coaching funktionalitet:</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                Knappen startar en djupanalys av dina assessments och skapar personliga actionables 
                baserat på neuroplastiska principer och din utvecklingsprofil.
              </p>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Din plan anpassas automatiskt baserat på nya assessments och framsteg
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};