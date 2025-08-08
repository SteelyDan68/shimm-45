import { ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ActionTooltipProps {
  content: string;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
  disabled?: boolean;
}

export const ActionTooltip = ({ 
  content, 
  children,
  side = 'top',
  align = 'center',
  className = '',
  disabled = false
}: ActionTooltipProps) => {
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild className={className}>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align}
          className="bg-popover border shadow-md z-50"
        >
          <p className="text-sm text-foreground">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};