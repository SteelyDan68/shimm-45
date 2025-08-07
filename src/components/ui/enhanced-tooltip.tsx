/**
 * 🎯 ENHANCED TOOLTIP SYSTEM
 * Avancerade tooltips med symboler, animationer och hover-effekter
 */

import React from 'react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  HelpCircle, 
  Info, 
  AlertCircle, 
  CheckCircle, 
  Star,
  Lightbulb,
  Settings,
  Users,
  BarChart3,
  Database,
  Brain,
  Shield,
  Zap,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TooltipVariant = 'info' | 'help' | 'warning' | 'success' | 'tip' | 'feature';
export type TooltipIconType = 'help' | 'info' | 'warning' | 'success' | 'star' | 'lightbulb' | 'settings' | 'users' | 'analytics' | 'database' | 'brain' | 'shield' | 'zap' | 'target';

interface EnhancedTooltipProps {
  content: string;
  variant?: TooltipVariant;
  icon?: TooltipIconType;
  side?: 'top' | 'right' | 'bottom' | 'left';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  children?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  maxWidth?: string;
  delay?: number;
}

const iconMap = {
  help: HelpCircle,
  info: Info,
  warning: AlertCircle,
  success: CheckCircle,
  star: Star,
  lightbulb: Lightbulb,
  settings: Settings,
  users: Users,
  analytics: BarChart3,
  database: Database,
  brain: Brain,
  shield: Shield,
  zap: Zap,
  target: Target
};

const variantStyles = {
  info: {
    icon: 'text-blue-500 hover:text-blue-600',
    content: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100'
  },
  help: {
    icon: 'text-gray-500 hover:text-gray-600',
    content: 'bg-gray-50 border-gray-200 text-gray-900 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-100'
  },
  warning: {
    icon: 'text-amber-500 hover:text-amber-600',
    content: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100'
  },
  success: {
    icon: 'text-green-500 hover:text-green-600',
    content: 'bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100'
  },
  tip: {
    icon: 'text-purple-500 hover:text-purple-600',
    content: 'bg-purple-50 border-purple-200 text-purple-900 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-100'
  },
  feature: {
    icon: 'text-indigo-500 hover:text-indigo-600',
    content: 'bg-indigo-50 border-indigo-200 text-indigo-900 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-100'
  }
};

const sizeStyles = {
  sm: {
    icon: 'h-3 w-3',
    content: 'text-xs max-w-48 p-2'
  },
  md: {
    icon: 'h-4 w-4',
    content: 'text-sm max-w-64 p-3'
  },
  lg: {
    icon: 'h-5 w-5',
    content: 'text-base max-w-80 p-4'
  }
};

export const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({
  content,
  variant = 'help',
  icon = 'help',
  side = 'top',
  size = 'md',
  showIcon = true,
  children,
  className,
  contentClassName,
  maxWidth,
  delay = 300
}) => {
  const IconComponent = iconMap[icon];
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <TooltipProvider delayDuration={delay}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children ? (
            children
          ) : (
            <button
              type="button"
              className={cn(
                "inline-flex items-center justify-center rounded-full transition-all duration-200",
                "hover:scale-110 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2",
                "focus:ring-blue-500 active:scale-95",
                variantStyle.icon,
                sizeStyle.icon,
                className
              )}
              aria-label="Mer information"
            >
              {showIcon && <IconComponent className={sizeStyle.icon} />}
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className={cn(
            "animate-fade-in border shadow-lg",
            variantStyle.content,
            sizeStyle.content,
            maxWidth && `max-w-[${maxWidth}]`,
            contentClassName
          )}
        >
          <div className="leading-relaxed">
            {content}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Specialized tooltip components for common use cases
export const InfoTooltip: React.FC<Omit<EnhancedTooltipProps, 'variant' | 'icon'>> = (props) => (
  <EnhancedTooltip {...props} variant="info" icon="info" />
);

export const HelpTooltip: React.FC<Omit<EnhancedTooltipProps, 'variant' | 'icon'>> = (props) => (
  <EnhancedTooltip {...props} variant="help" icon="help" />
);

export const WarningTooltip: React.FC<Omit<EnhancedTooltipProps, 'variant' | 'icon'>> = (props) => (
  <EnhancedTooltip {...props} variant="warning" icon="warning" />
);

export const SuccessTooltip: React.FC<Omit<EnhancedTooltipProps, 'variant' | 'icon'>> = (props) => (
  <EnhancedTooltip {...props} variant="success" icon="success" />
);

export const TipTooltip: React.FC<Omit<EnhancedTooltipProps, 'variant' | 'icon'>> = (props) => (
  <EnhancedTooltip {...props} variant="tip" icon="lightbulb" />
);

export const FeatureTooltip: React.FC<Omit<EnhancedTooltipProps, 'variant' | 'icon'>> = (props) => (
  <EnhancedTooltip {...props} variant="feature" icon="star" />
);

// Action button tooltip wrapper
interface ActionTooltipProps extends Omit<EnhancedTooltipProps, 'children'> {
  children: React.ReactNode;
  action?: string;
}

export const ActionTooltip: React.FC<ActionTooltipProps> = ({
  children,
  content,
  action,
  ...props
}) => (
  <EnhancedTooltip
    {...props}
    content={action ? `${action}: ${content}` : content}
  >
    <div className="hover-scale transition-transform duration-200 hover:scale-105">
      {children}
    </div>
  </EnhancedTooltip>
);

// Specialized tooltips for specific domains
export const NeuroplasticityTooltip: React.FC<Omit<EnhancedTooltipProps, 'variant' | 'icon'>> = (props) => (
  <EnhancedTooltip {...props} variant="feature" icon="brain" />
);

export const ScienceTooltip: React.FC<Omit<EnhancedTooltipProps, 'variant' | 'icon'>> = (props) => (
  <EnhancedTooltip {...props} variant="info" icon="lightbulb" />
);