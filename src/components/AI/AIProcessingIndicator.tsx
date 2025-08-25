import React, { useEffect, useState } from 'react';
import { AIComponentWrapper } from '@/components/AI/AIComponentWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Loader2, CheckCircle2, AlertCircle, Zap, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIProcessingSession } from '@/hooks/useAIProcessingTracking';

interface AIProcessingIndicatorProps {
  session: AIProcessingSession | null;
  className?: string;
  compact?: boolean;
}

const processingSteps = {
  assessment_analysis: [
    'Läser dina svar...',
    'Analyserar mönster...',
    'Identifierar styrkor...',
    'Upptäcker utvecklingsområden...',
    'Skapar personlig profil...',
    'Slutför analys...'
  ],
  actionable_generation: [
    'Processerar analysresultat...',
    'Identifierar neuroplastiska möjligheter...',
    'Skapar utvecklingsstrategier...',
    'Prioriterar handlingar...',
    'Anpassar svårighetsgrad...',
    'Genererar konkreta steg...'
  ],
  calendar_optimization: [
    'Analyserar dina mönster...',
    'Beräknar optimal timing...',
    'Balanserar arbetsbörda...',
    'Skapar adaptiv schema...',
    'Optimerar för neuroplastik...',
    'Slutför schemaläggning...'
  ]
};

const getProcessIcon = (processType: AIProcessingSession['process_type']) => {
  switch (processType) {
    case 'assessment_analysis': return Brain;
    case 'actionable_generation': return Target;
    case 'calendar_optimization': return Zap;
    default: return Brain;
  }
};

const getProcessTitle = (processType: AIProcessingSession['process_type']) => {
  switch (processType) {
    case 'assessment_analysis': return 'AI-Analys';
    case 'actionable_generation': return 'Genererar Handlingsplan';
    case 'calendar_optimization': return 'Optimerar Schema';
    default: return 'AI-Bearbetning';
  }
};

const getStatusColor = (status: AIProcessingSession['status']) => {
  switch (status) {
    case 'completed': return 'text-success';
    case 'failed': return 'text-destructive';
    case 'processing': return 'text-primary';
    default: return 'text-muted-foreground';
  }
};

export function AIProcessingIndicator({ session, className, compact = false }: AIProcessingIndicatorProps) {
  if (!session) return null;

  return (
    <AIComponentWrapper
      componentName="AI Processing Indicator"
      loadingMessage="Förbereder AI-bearbetning..."
      enableAutoRetry={false}
    >
      <AIProcessingIndicatorContent session={session} className={className} compact={compact} />
    </AIComponentWrapper>
  );
}

function AIProcessingIndicatorContent({ session, className, compact = false }: AIProcessingIndicatorProps) {
  if (!session) return null;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);

  // Animate through processing steps
  useEffect(() => {
    if (!session || session.status !== 'processing') return;

    const steps = processingSteps[session.process_type] || processingSteps.assessment_analysis;
    const stepDuration = 2000; // 2 seconds per step
    
    const interval = setInterval(() => {
      setCurrentStepIndex(prev => {
        const nextIndex = (prev + 1) % steps.length;
        if (nextIndex === 0) {
          setAnimationKey(prev => prev + 1); // Restart animation
        }
        return nextIndex;
      });
    }, stepDuration);

    return () => clearInterval(interval);
  }, [session?.process_type, session?.status]);

  if (!session) return null;

  const IconComponent = getProcessIcon(session.process_type);
  const title = getProcessTitle(session.process_type);
  const steps = processingSteps[session.process_type] || processingSteps.assessment_analysis;
  const currentStep = steps[currentStepIndex];

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <div className="flex items-center gap-1">
          {session.status === 'processing' && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
          {session.status === 'completed' && (
            <CheckCircle2 className="h-4 w-4 text-success" />
          )}
          {session.status === 'failed' && (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          <span className={getStatusColor(session.status)}>
            {session.status === 'processing' && currentStep}
            {session.status === 'completed' && 'Analys klar!'}
            {session.status === 'failed' && 'Fel uppstod'}
          </span>
        </div>
        {session.status === 'processing' && (
          <Badge variant="outline" className="text-xs">
            {session.progress_percentage}%
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-full",
                {
                  'bg-primary/10': session.status === 'processing',
                  'bg-success/10': session.status === 'completed',
                  'bg-destructive/10': session.status === 'failed'
                }
              )}>
                {session.status === 'processing' && (
                  <IconComponent className="h-6 w-6 text-primary animate-pulse" />
                )}
                {session.status === 'completed' && (
                  <CheckCircle2 className="h-6 w-6 text-success" />
                )}
                {session.status === 'failed' && (
                  <AlertCircle className="h-6 w-6 text-destructive" />
                )}
              </div>
              <div>
                <h3 className="font-medium">{title}</h3>
                <p className="text-sm text-muted-foreground">
                  {session.pillar_type && `${session.pillar_type.charAt(0).toUpperCase() + session.pillar_type.slice(1)} pillar`}
                </p>
              </div>
            </div>

            <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
              {session.progress_percentage}%
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress 
              value={session.progress_percentage} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Startad {new Date(session.started_at).toLocaleTimeString('sv-SE', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</span>
              {session.completed_at && (
                <span>Slutförd {new Date(session.completed_at).toLocaleTimeString('sv-SE', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              )}
            </div>
          </div>

          {/* Current Step */}
          {session.status === 'processing' && (
            <div 
              key={`${animationKey}-${currentStepIndex}`}
              className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg animate-in fade-in duration-500"
            >
              <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
              <span className="text-sm text-primary font-medium">
                {currentStep}
              </span>
            </div>
          )}

          {/* Success Message */}
          {session.status === 'completed' && (
            <div className="flex items-center gap-2 p-3 bg-success/5 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
              <div className="text-sm">
                <span className="text-success font-medium">Analys slutförd! </span>
                <span className="text-muted-foreground">
                  Stefan har skapat en personlig utvecklingsplan baserad på dina svar.
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {session.status === 'failed' && session.error_details && (
            <div className="flex items-start gap-2 p-3 bg-destructive/5 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="text-destructive font-medium">Något gick fel: </span>
                <span className="text-muted-foreground">
                  {session.error_details}
                </span>
              </div>
            </div>
          )}

          {/* Estimated Time */}
          {session.status === 'processing' && session.estimated_completion_time && (
            <div className="text-xs text-muted-foreground text-center">
              Beräknad slutförandetid: {new Date(session.estimated_completion_time).toLocaleTimeString('sv-SE', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}