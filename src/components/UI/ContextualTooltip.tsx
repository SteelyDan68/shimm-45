import React, { useState, useEffect } from 'react';
import { HelpCircle, Info, Lightbulb, Target, Brain } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface ContextualTooltipProps {
  actionableId?: string;
  assessmentRoundId?: string;
  questionKey?: string;
  pillarType?: string;
  children: React.ReactNode;
  className?: string;
  type?: 'info' | 'reasoning' | 'neuroplastic' | 'connection';
  fallbackContent?: string;
}

interface AssessmentActionableMapping {
  id: string;
  actionable_reasoning: string;
  confidence_score: number;
  pillar_connection: string;
  neuroplastic_rationale?: string;
  assessment_question_key: string;
}

const getTooltipIcon = (type: ContextualTooltipProps['type']) => {
  switch (type) {
    case 'reasoning': return Target;
    case 'neuroplastic': return Brain;
    case 'connection': return Lightbulb;
    default: return Info;
  }
};

const getTooltipColor = (type: ContextualTooltipProps['type']) => {
  switch (type) {
    case 'reasoning': return 'text-blue-600';
    case 'neuroplastic': return 'text-purple-600';
    case 'connection': return 'text-amber-600';
    default: return 'text-muted-foreground';
  }
};

export function ContextualTooltip({
  actionableId,
  assessmentRoundId,
  questionKey,
  pillarType,
  children,
  className,
  type = 'info',
  fallbackContent
}: ContextualTooltipProps) {
  const [mapping, setMapping] = useState<AssessmentActionableMapping | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const IconComponent = getTooltipIcon(type);
  const iconColor = getTooltipColor(type);

  // Load mapping data when tooltip is triggered
  const loadMappingData = async () => {
    if (!actionableId || !assessmentRoundId || mapping || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('assessment_actionable_mappings')
        .select('*')
        .eq('actionable_id', actionableId)
        .eq('assessment_round_id', assessmentRoundId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setMapping(data);
    } catch (err) {
      console.error('Failed to load mapping data:', err);
      setError('Kunde inte ladda kontextuell information');
    } finally {
      setIsLoading(false);
    }
  };

  const getTooltipContent = () => {
    if (fallbackContent) return fallbackContent;
    if (error) return error;
    if (isLoading) return 'Laddar kontextuell information...';
    if (!mapping) return 'Ingen kontextuell information tillgänglig';

    switch (type) {
      case 'reasoning':
        return (
          <div className="space-y-2">
            <div className="font-medium">Varför denna handlingsplan?</div>
            <div className="text-sm">{mapping.actionable_reasoning}</div>
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="outline" className="text-xs">
                Säkerhet: {Math.round(mapping.confidence_score * 100)}%
              </Badge>
            </div>
          </div>
        );

      case 'neuroplastic':
        return (
          <div className="space-y-2">
            <div className="font-medium flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Neuroplastisk fördel
            </div>
            <div className="text-sm">
              {mapping.neuroplastic_rationale || 
               'Denna aktivitet optimerar hjärnans plasticitet genom att utmana dig lagom mycket för maximal utveckling.'}
            </div>
          </div>
        );

      case 'connection':
        return (
          <div className="space-y-2">
            <div className="font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Koppling till bedömning
            </div>
            <div className="text-sm">{mapping.pillar_connection}</div>
            {mapping.assessment_question_key && (
              <div className="text-xs text-muted-foreground pt-1">
                Baserat på: {mapping.assessment_question_key}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <div className="text-sm">{mapping.actionable_reasoning}</div>
            <div className="text-xs text-muted-foreground">
              {mapping.pillar_connection}
            </div>
          </div>
        );
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger 
          asChild
          onMouseEnter={loadMappingData}
          onFocusCapture={loadMappingData}
        >
          <div className={cn("inline-flex items-center gap-1 cursor-help", className)}>
            {children}
            <IconComponent className={cn("h-4 w-4", iconColor)} />
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-sm p-3"
          sideOffset={5}
        >
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Specialized tooltip components for common use cases
export function ActionableReasoningTooltip({
  actionableId,
  assessmentRoundId,
  children,
  className
}: Omit<ContextualTooltipProps, 'type'>) {
  return (
    <ContextualTooltip
      actionableId={actionableId}
      assessmentRoundId={assessmentRoundId}
      type="reasoning"
      className={className}
    >
      {children}
    </ContextualTooltip>
  );
}

export function NeuroplasticTooltip({
  actionableId,
  assessmentRoundId,
  children,
  className
}: Omit<ContextualTooltipProps, 'type'>) {
  return (
    <ContextualTooltip
      actionableId={actionableId}
      assessmentRoundId={assessmentRoundId}
      type="neuroplastic"
      className={className}
    >
      {children}
    </ContextualTooltip>
  );
}

export function AssessmentConnectionTooltip({
  actionableId,
  assessmentRoundId,
  children,
  className
}: Omit<ContextualTooltipProps, 'type'>) {
  return (
    <ContextualTooltip
      actionableId={actionableId}
      assessmentRoundId={assessmentRoundId}
      type="connection"
      className={className}
    >
      {children}
    </ContextualTooltip>
  );
}