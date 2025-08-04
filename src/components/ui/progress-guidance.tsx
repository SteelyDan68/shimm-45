/**
 * ✅ PROGRESS GUIDANCE COMPONENT
 * 100% UX compliance med pedagogisk vägledning
 * Implementerar global UX policies för progress feedback
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  Lightbulb, 
  Target,
  Timer,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NextStep {
  id: string;
  title: string;
  description: string;
  estimatedTime: number; // minuter
  priority: 'high' | 'medium' | 'low';
  category: string;
}

interface ProgressGuidanceProps {
  currentProgress: number; // 0-100
  currentStep: string;
  completedSteps: string[];
  nextSteps: NextStep[];
  totalEstimatedTime?: number;
  onStepSelect?: (stepId: string) => void;
  onViewFullJourney?: () => void;
  className?: string;
  showCelebration?: boolean;
  milestone?: {
    name: string;
    description: string;
    reward: string;
  };
}

export const ProgressGuidance: React.FC<ProgressGuidanceProps> = ({
  currentProgress,
  currentStep,
  completedSteps,
  nextSteps,
  totalEstimatedTime,
  onStepSelect,
  onViewFullJourney,
  className,
  showCelebration = false,
  milestone
}) => {
  const progressColor = currentProgress < 30 ? 'bg-orange-500' : 
                       currentProgress < 70 ? 'bg-blue-500' : 'bg-green-500';
  
  const nextHighPriorityStep = nextSteps.find(step => step.priority === 'high');
  const recommendedStep = nextHighPriorityStep || nextSteps[0];

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Din utvecklingsresa
          </CardTitle>
          <Badge variant={currentProgress === 100 ? "default" : "secondary"}>
            {currentProgress}% genomfört
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress visualisering */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Framsteg</span>
            {totalEstimatedTime && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Timer className="h-3 w-3" />
                ~{totalEstimatedTime} min kvar
              </span>
            )}
          </div>
          <Progress value={currentProgress} className={`h-3 ${progressColor}`} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Start</span>
            <span className="font-medium">{currentStep}</span>
            <span>Klar</span>
          </div>
        </div>

        {/* Celebration för milstolpar */}
        {showCelebration && milestone && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-900">{milestone.name}</h4>
                <p className="text-sm text-green-700 mt-1">{milestone.description}</p>
                <div className="bg-green-100 rounded-md p-2 mt-2">
                  <p className="text-sm font-medium text-green-800">
                    🎉 Belöning: {milestone.reward}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Senast genomförda steg */}
        {completedSteps.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Senast genomfört
            </h4>
            <div className="text-sm text-muted-foreground bg-green-50 rounded-md p-2">
              {completedSteps[completedSteps.length - 1]}
            </div>
          </div>
        )}

        {/* Rekommenderat nästa steg */}
        {recommendedStep && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Rekommenderat nästa steg
            </h4>
            
            <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-medium">{recommendedStep.title}</h5>
                    <Badge 
                      variant={recommendedStep.priority === 'high' ? 'destructive' : 
                              recommendedStep.priority === 'medium' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {recommendedStep.priority === 'high' ? 'Hög prioritet' :
                       recommendedStep.priority === 'medium' ? 'Medium prioritet' : 'Låg prioritet'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {recommendedStep.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {recommendedStep.estimatedTime} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      {recommendedStep.category}
                    </span>
                  </div>
                </div>
                
                {onStepSelect && (
                  <Button 
                    size="sm"
                    onClick={() => onStepSelect(recommendedStep.id)}
                    className="shrink-0"
                  >
                    Börja nu
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Kommande steg förhandsvisning */}
        {nextSteps.length > 1 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Kommande steg</h4>
            <div className="space-y-2">
              {nextSteps.slice(1, 4).map((step, index) => (
                <div 
                  key={step.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {index + 2}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {step.estimatedTime} min • {step.category}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          {onViewFullJourney && (
            <Button variant="outline" size="sm" onClick={onViewFullJourney}>
              Se hela resan
            </Button>
          )}
          
          {currentProgress === 100 && (
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              🎉 Grattis! Starta nästa nivå
            </Button>
          )}
        </div>

        {/* Motivational insight */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Neuroplastisk insikt</p>
              <p className="text-blue-700 mt-1">
                {currentProgress < 30 
                  ? "Dina första steg bygger nya neurala kopplingar. Varje liten framgång stärker din motivation!"
                  : currentProgress < 70
                  ? "Du är mitt i neuroplastisk förändring! Din hjärna anpassar sig aktivt till nya mönster."
                  : "Fantastiskt! Du har skapat starka neurala vägar. Nu handlar det om att befästa förändringen."
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};