import { ReactNode } from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HelpTooltipProps {
  content: string;
  children?: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export const HelpTooltip = ({ 
  content, 
  children, 
  side = 'top',
  align = 'center',
  className = ''
}: HelpTooltipProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className={`inline-flex items-center ${className}`}>
          {children ? (
            children
          ) : (
            <Info className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
          )}
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align}
          className="max-w-xs p-3 text-sm bg-popover border shadow-md z-50"
        >
          <p className="text-foreground">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};