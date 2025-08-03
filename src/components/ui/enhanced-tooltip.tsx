/**
 * ENHANCED TOOLTIP SYSTEM
 * 
 * UX Designer: Konsistent tooltip-arkitektur för alla komponenter
 * QA Engineer: Systematisk validering av tooltip-coverage
 * Solution Architect: Skalbar hjälpsystem med centraliserad logik
 * 
 * WORLD-CLASS EXECUTION: Enterprise tooltip management med 16-års fokus
 */

import { ReactNode } from 'react';
import { Info, Brain, Lightbulb, Zap, Target, TrendingUp } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { NEUROPLASTICITY_TOOLTIPS } from '@/config/neuroplasticityLanguage';

interface TooltipTheme {
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: ReactNode;
}

const TOOLTIP_THEMES: Record<string, TooltipTheme> = {
  default: {
    bgColor: 'bg-popover',
    borderColor: 'border-border',
    textColor: 'text-foreground',
    icon: <Info className="h-3 w-3" />
  },
  neuroplasticity: {
    bgColor: 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-900 dark:text-blue-100',
    icon: <Brain className="h-3 w-3 text-blue-600" />
  },
  science: {
    bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950',
    borderColor: 'border-green-200 dark:border-green-800', 
    textColor: 'text-green-900 dark:text-green-100',
    icon: <Lightbulb className="h-3 w-3 text-green-600" />
  },
  energy: {
    bgColor: 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    textColor: 'text-yellow-900 dark:text-yellow-100', 
    icon: <Zap className="h-3 w-3 text-yellow-600" />
  },
  progress: {
    bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950',
    borderColor: 'border-purple-200 dark:border-purple-800',
    textColor: 'text-purple-900 dark:text-purple-100',
    icon: <TrendingUp className="h-3 w-3 text-purple-600" />
  }
};

interface EnhancedTooltipProps {
  content: string;
  children?: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
  theme?: keyof typeof TOOLTIP_THEMES;
  showIcon?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg';
  persistent?: boolean; // För viktiga tooltips som ska synas längre
}

export const EnhancedTooltip = ({ 
  content, 
  children, 
  side = 'top',
  align = 'center',
  className = '',
  theme = 'default',
  showIcon = true,
  maxWidth = 'xs',
  persistent = false
}: EnhancedTooltipProps) => {
  const selectedTheme = TOOLTIP_THEMES[theme];
  const maxWidthClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm', 
    md: 'max-w-md',
    lg: 'max-w-lg'
  };

  return (
    <TooltipProvider delayDuration={persistent ? 0 : 300}>
      <Tooltip>
        <TooltipTrigger className={`inline-flex items-center ${className}`}>
          {children ? (
            children
          ) : (
            <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-help">
              {showIcon && selectedTheme.icon}
            </div>
          )}
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align}
          className={`
            ${maxWidthClasses[maxWidth]} 
            ${selectedTheme.bgColor} 
            ${selectedTheme.borderColor} 
            ${selectedTheme.textColor}
            p-3 text-sm border shadow-lg z-50 rounded-lg
          `}
          sideOffset={5}
        >
          <div className="space-y-2">
            <p className="leading-relaxed">{content}</p>
            {theme === 'neuroplasticity' && (
              <div className="text-xs opacity-75 border-t border-current/20 pt-2">
                💡 Baserat på 30+ års hjärnforskning
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Specialiserade tooltip-komponenter för olika användningsområden
export const NeuroplasticityTooltip = ({ 
  children, 
  context = 'simple',
  ...props 
}: Omit<EnhancedTooltipProps, 'content' | 'theme'> & { 
  context?: keyof typeof NEUROPLASTICITY_TOOLTIPS 
}) => (
  <EnhancedTooltip
    content={NEUROPLASTICITY_TOOLTIPS[context]}
    theme="neuroplasticity"
    maxWidth="md"
    persistent={true}
    {...props}
  >
    {children}
  </EnhancedTooltip>
);

export const ScienceTooltip = ({ children, content, ...props }: Omit<EnhancedTooltipProps, 'theme'>) => (
  <EnhancedTooltip
    content={content}
    theme="science"
    {...props}
  >
    {children}
  </EnhancedTooltip>
);

export const ProgressTooltip = ({ children, content, ...props }: Omit<EnhancedTooltipProps, 'theme'>) => (
  <EnhancedTooltip
    content={content}
    theme="progress"
    {...props}
  >
    {children}
  </EnhancedTooltip>
);

// Tooltip registry för automatisk validering
interface TooltipRule {
  component: string;
  requiredTooltips: string[];
  importance: 'critical' | 'high' | 'medium' | 'low';
}

export const TOOLTIP_COVERAGE_RULES: TooltipRule[] = [
  {
    component: 'NeuroplasticTaskGenerator',
    requiredTooltips: ['neuroplastic_principles', 'task_generation', 'micro_steps'],
    importance: 'critical'
  },
  {
    component: 'WelcomeAssessmentCard', 
    requiredTooltips: ['assessment_purpose', 'time_estimate', 'privacy'],
    importance: 'high'
  },
  {
    component: 'ClientJourneyOrchestrator',
    requiredTooltips: ['journey_phases', 'ai_recommendations', 'progress_tracking'],
    importance: 'high'
  }
];

// Validation function för tooltip coverage
export const validateTooltipCoverage = (componentName: string): {
  hasRequiredTooltips: boolean;
  missingTooltips: string[];
  importance: string;
} => {
  const rule = TOOLTIP_COVERAGE_RULES.find(r => r.component === componentName);
  
  if (!rule) {
    return {
      hasRequiredTooltips: true,
      missingTooltips: [],
      importance: 'low'
    };
  }

  // I produktion skulle detta integrera med en tooltip registry
  // För nu, returnera placeholder
  return {
    hasRequiredTooltips: false,
    missingTooltips: rule.requiredTooltips,
    importance: rule.importance
  };
};

// Legacy support - gradvis migration
export const HelpTooltip = EnhancedTooltip;