import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigation } from '@/hooks/useNavigation';
import { ArrowRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateAndExecuteNavigation } from '@/utils/navigationValidator';

interface ActionPromptProps {
  title: string;
  description: string;
  actionText: string;
  targetRoute?: string;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  componentName?: string; // For navigation validation
}

export const ActionPrompt: React.FC<ActionPromptProps> = ({
  title,
  description,
  actionText,
  targetRoute,
  onClick,
  variant = 'default',
  size = 'default',
  icon,
  className,
  disabled = false,
  loading = false,
  componentName = 'UnknownComponent'
}) => {
  const { navigateTo } = useNavigation();

  const handleAction = () => {
    // Validate navigation before executing
    const isValid = validateAndExecuteNavigation(
      componentName,
      actionText,
      targetRoute,
      onClick
    );
    
    if (!isValid) {
      console.error(`🚨 Navigation blocked for safety in ${componentName}`);
      return;
    }
    
    if (onClick) {
      onClick();
    } else if (targetRoute) {
      navigateTo(targetRoute);
    }
  };

  return (
    <Card className={cn("border-primary/20 bg-gradient-to-br from-background to-background/80", className)}>
      <CardContent className="p-4 space-y-3">
        <div>
          <h4 className="font-medium text-foreground mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        
        <Button 
          onClick={handleAction}
          variant={variant}
          size={size}
          disabled={disabled || loading}
          className="w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Zap className="h-4 w-4 animate-spin" />
              Laddar...
            </>
          ) : (
            <>
              {icon}
              {actionText}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};