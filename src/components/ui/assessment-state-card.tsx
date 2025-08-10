/**
 * UNIVERSELL SJÄLVSKATTNINGS STATE CARD
 * 
 * Unified component för hantering av alla självskattnings states:
 * - NOT_STARTED, IN_PROGRESS, COMPLETED, EXPIRED, ERROR
 * - Konsekvent UX pattern för alla självskattnings typer
 * - Kontrollerad användarresa med tydlig messaging
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ActionPrompt } from '@/components/ui/action-prompt';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Play, 
  Clock, 
  RotateCcw, 
  AlertCircle,
  Star,
  Brain
} from 'lucide-react';
import { get16YoText } from '@/config/language16yo';

export type AssessmentState = 'not_started' | 'in_progress' | 'completed' | 'expired' | 'error';

export interface AssessmentStateData {
  state: AssessmentState;
  title: string;
  description: string;
  timeEstimate?: string;
  completedAt?: string;
  lastSavedAt?: string;
  progressInfo?: string;
  canStart: boolean;
  canResume: boolean;
  canRestart: boolean;
  shouldShowForm: boolean;
  
  // Callbacks
  onStart?: () => void;
  onResume?: () => void;
  onRestart?: () => void;
  onViewResults?: () => void;
  
  // Optional customization
  neuroplasticPrinciple?: string;
  aiAnalysisPreview?: string;
  customIcon?: React.ReactNode;
  variant?: 'default' | 'compact';
}

export const AssessmentStateCard = (props: AssessmentStateData) => {
  const {
    state,
    title,
    description,
    timeEstimate,
    completedAt,
    lastSavedAt,
    progressInfo,
    canStart,
    canResume,
    canRestart,
    onStart,
    onResume,
    onRestart,
    onViewResults,
    neuroplasticPrinciple,
    aiAnalysisPreview,
    customIcon,
    variant = 'default'
  } = props;

  // State-specific rendering logic
  const getStateConfig = () => {
    switch (state) {
      case 'not_started':
        return {
          icon: customIcon || <Play className="h-4 w-4" />,
          badgeVariant: 'secondary' as const,
          badgeText: get16YoText('status', 'not_started'),
          primaryAction: {
            text: get16YoText('ui', 'start_now'),
            onClick: onStart,
            variant: 'default' as const,
            size: variant === 'compact' ? 'default' as const : 'lg' as const
          }
        };
        
      case 'in_progress':
        return {
          icon: <Clock className="h-4 w-4" />,
          badgeVariant: 'default' as const,
          badgeText: get16YoText('status', 'in_progress'),
          primaryAction: {
            text: get16YoText('ui', 'continue'),
            onClick: onResume,
            variant: 'default' as const
          },
          secondaryAction: canRestart ? {
            text: get16YoText('ui', 'restart'),
            onClick: onRestart,
            variant: 'ghost' as const
          } : undefined
        };
        
      case 'completed':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          badgeVariant: 'secondary' as const,
          badgeText: get16YoText('status', 'completed'),
          primaryAction: canRestart ? {
            text: get16YoText('ui', 'take_again'),
            onClick: onRestart,
            variant: 'outline' as const
          } : undefined,
          secondaryAction: onViewResults ? {
            text: "Se tidigare svar",
            onClick: onViewResults,
            variant: 'ghost' as const
          } : undefined
        };
        
      case 'expired':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          badgeVariant: 'destructive' as const,
          badgeText: get16YoText('status', 'expired'),
          primaryAction: {
            text: get16YoText('ui', 'restart'),
            onClick: onRestart,
            variant: 'default' as const
          }
        };
        
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          badgeVariant: 'destructive' as const,
          badgeText: 'Fel',
          primaryAction: {
            text: 'Försök igen',
            onClick: onStart || onRestart,
            variant: 'default' as const
          }
        };
        
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          badgeVariant: 'secondary' as const,
          badgeText: 'Okänd status'
        };
    }
  };

  const config = getStateConfig();

  // Render helpers
  const renderStatusInfo = () => {
    if (state === 'completed' && completedAt) {
      const daysAgo = Math.floor(
        (Date.now() - new Date(completedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-3 w-3" />
          <span>Slutförd för {daysAgo} dagar sedan</span>
        </div>
      );
    }
    
    if (state === 'in_progress' && lastSavedAt) {
      const hoursAgo = Math.floor(
        (Date.now() - new Date(lastSavedAt).getTime()) / (1000 * 60 * 60)
      );
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Sparad för {hoursAgo} timmar sedan</span>
          {progressInfo && <span>• {progressInfo}</span>}
        </div>
      );
    }
    
    return null;
  };

  const renderNeuroplasticPrinciple = () => {
    // Dold enligt användarens önskemål
    return null;
  };

  const renderTimeEstimate = () => {
    // Dold enligt användarens önskemål  
    return null;
  };

  const renderAIPreview = () => {
    if (!aiAnalysisPreview || state === 'completed') return null;
    
    return (
      <div className="p-3 bg-secondary/20 rounded-lg border">
        <div className="flex items-center gap-2 text-sm font-medium mb-1">
          <Star className="h-4 w-4 text-primary" />
          AI-analys inkluderar:
        </div>
        <p className="text-sm text-muted-foreground">{aiAnalysisPreview}</p>
      </div>
    );
  };

  // Compact variant för mindre utrymme
  if (variant === 'compact') {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {config.icon}
                <Badge variant={config.badgeVariant}>
                  {config.badgeText}
                </Badge>
              </div>
              <div>
                <h4 className="font-medium">{title}</h4>
                {renderStatusInfo()}
              </div>
            </div>
            
            <div className="flex gap-2">
              {config.secondaryAction && (
                <Button
                  variant={config.secondaryAction.variant}
                  size="sm"
                  onClick={config.secondaryAction.onClick}
                >
                  {config.secondaryAction.text}
                </Button>
              )}
              {config.primaryAction && (
                <Button
                  variant={config.primaryAction.variant}
                  size="sm"
                  onClick={config.primaryAction.onClick}
                >
                  {config.primaryAction.text}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default full variant
  return (
    <Card className="w-full">
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {config.icon}
              <Badge variant={config.badgeVariant}>
                {config.badgeText}
              </Badge>
          </div>
          {renderTimeEstimate()}
        </div>

        {/* Status info */}
        {renderStatusInfo()}

        {/* Neuroplastic principle */}
        {renderNeuroplasticPrinciple()}

        {/* Main content */}
        {state === 'not_started' && (
          <ActionPrompt
            title={title}
            description={description}
            actionText={config.primaryAction?.text || 'Börja'}
            onClick={config.primaryAction?.onClick}
            size={config.primaryAction?.size || 'lg'}
            componentName="AssessmentStateCard"
            icon={config.icon}
          />
        )}

        {state === 'in_progress' && (
          <div className="space-y-3">
            <ActionPrompt
              title="Fortsätt där du slutade"
              description="Du har redan svarat på några frågor - fortsätt där du slutade!"
              actionText={config.primaryAction?.text || 'Fortsätt'}
              onClick={config.primaryAction?.onClick}
              variant="default"
              componentName="AssessmentStateCard"
              icon={<Play className="h-4 w-4" />}
            />
            
            {config.secondaryAction && (
              <Button
                variant={config.secondaryAction.variant}
                size="sm"
                onClick={config.secondaryAction.onClick}
                className="w-full text-muted-foreground"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {config.secondaryAction.text}
              </Button>
            )}
          </div>
        )}

        {state === 'completed' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Självskattning slutförd!</span>
            </div>
            
            <p className="text-muted-foreground">
              {description}
            </p>
            
            <div className="flex gap-3">
              {config.primaryAction && (
                <Button
                  variant={config.primaryAction.variant}
                  onClick={config.primaryAction.onClick}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {config.primaryAction.text}
                </Button>
              )}
              
              {config.secondaryAction && (
                <Button
                  variant={config.secondaryAction.variant}
                  onClick={config.secondaryAction.onClick}
                  className="flex-1"
                >
                  {config.secondaryAction.text}
                </Button>
              )}
            </div>
          </div>
        )}

        {(state === 'expired' || state === 'error') && (
          <ActionPrompt
            title={title}
            description={description}
            actionText={config.primaryAction?.text || 'Försök igen'}
            onClick={config.primaryAction?.onClick}
            variant="outline"
            componentName="AssessmentStateCard"
            icon={config.icon}
          />
        )}

        {/* AI Preview */}
        {renderAIPreview()}
      </CardContent>
    </Card>
  );
};