import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Circle, Clock, AlertCircle, Brain, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PipelineProgress } from '@/hooks/useAIProcessingTracking';

interface PipelineProgressStepperProps {
  progress: PipelineProgress | null;
  className?: string;
}

const steps = [
  {
    key: 'assessment' as const,
    title: 'Bedömning',
    description: 'Genomför pillar-bedömning',
    icon: Circle,
    weight: 20
  },
  {
    key: 'ai_processing' as const,
    title: 'AI-Analys',
    description: 'Stefan analyserar dina svar',
    icon: Brain,
    weight: 30
  },
  {
    key: 'results_preview' as const,
    title: 'Resultat',
    description: 'Förhandsgranska analys',
    icon: CheckCircle2,
    weight: 10
  },
  {
    key: 'actionables_generation' as const,
    title: 'Handlingsplan',
    description: 'Generera konkreta steg',
    icon: Zap,
    weight: 25
  },
  {
    key: 'calendar_integration' as const,
    title: 'Schemaläggning',
    description: 'Integrera i kalender',
    icon: Clock,
    weight: 10
  },
  {
    key: 'completed' as const,
    title: 'Klar',
    description: 'Pipeline slutförd',
    icon: CheckCircle2,
    weight: 5
  }
];

export function PipelineProgressStepper({ progress, className }: PipelineProgressStepperProps) {
  if (!progress) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Ingen aktiv pipeline att visa
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStepIndex = steps.findIndex(step => step.key === progress.current_step);
  const isCompleted = progress.current_step === 'completed';

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };

  const getStepIcon = (step: typeof steps[0], status: string) => {
    const IconComponent = step.icon;
    
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'current':
        return <IconComponent className="h-5 w-5 text-primary animate-pulse" />;
      default:
        return <IconComponent className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Pipeline-framsteg</h3>
              <Badge variant={isCompleted ? "default" : "secondary"}>
                {progress.total_progress_percentage}% slutfört
              </Badge>
            </div>
            <Progress 
              value={progress.total_progress_percentage} 
              className="h-2"
            />
          </div>

          {/* Step Progress */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const isCurrentStep = status === 'current';
              
              return (
                <div key={step.key} className="flex items-start gap-4">
                  {/* Step Icon */}
                  <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2",
                    {
                      'border-success bg-success/10': status === 'completed',
                      'border-primary bg-primary/10': status === 'current',
                      'border-muted bg-muted/30': status === 'pending'
                    }
                  )}>
                    {getStepIcon(step, status)}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={cn(
                        "font-medium",
                        {
                          'text-success': status === 'completed',
                          'text-primary': status === 'current',
                          'text-muted-foreground': status === 'pending'
                        }
                      )}>
                        {step.title}
                      </h4>
                      {isCurrentStep && (
                        <Badge variant="outline" className="text-xs">
                          {progress.step_progress_percentage}%
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </p>

                    {/* Current Step Progress */}
                    {isCurrentStep && progress.step_progress_percentage > 0 && (
                      <div className="mt-2">
                        <Progress 
                          value={progress.step_progress_percentage} 
                          className="h-1"
                        />
                      </div>
                    )}

                    {/* Step Data Preview */}
                    {isCurrentStep && progress.step_data && Object.keys(progress.step_data).length > 0 && (
                      <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                        <span className="text-muted-foreground">
                          {progress.current_step === 'ai_processing' && 'Stefan analyserar...'}
                          {progress.current_step === 'actionables_generation' && 'Skapar handlingsplan...'}
                          {progress.current_step === 'calendar_integration' && 'Förbereder schemaläggning...'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "absolute left-5 mt-10 w-0.5 h-8 bg-border",
                      {
                        'bg-success/30': status === 'completed',
                        'bg-primary/30': status === 'current',
                        'bg-muted': status === 'pending'
                      }
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Timeline Information */}
          {progress.started_at && (
            <div className="pt-4 border-t space-y-1 text-xs text-muted-foreground">
              <div>Startad: {new Date(progress.started_at).toLocaleString('sv-SE')}</div>
              <div>Senaste aktivitet: {new Date(progress.last_activity_at).toLocaleString('sv-SE')}</div>
              {progress.completed_at && (
                <div className="text-success">
                  Slutförd: {new Date(progress.completed_at).toLocaleString('sv-SE')}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}