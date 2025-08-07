/**
 * ⚡ MICRO-INTERACTIONS & FEEDBACK SYSTEM
 * Enhanced user experience with loading states and success animations
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, AlertCircle, Info, Loader2,
  Zap, Heart, Star, Trophy, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * 🎯 ENHANCED LOADING STATES
 * Progressive loading with contextual messaging
 */
interface SmartLoadingProps {
  isLoading: boolean;
  progress?: number;
  stage?: string;
  children: React.ReactNode;
  loadingMessages?: string[];
  estimatedTime?: number;
}

export const SmartLoading: React.FC<SmartLoadingProps> = ({
  isLoading,
  progress,
  stage,
  children,
  loadingMessages = ['Laddar...', 'Bearbetar data...', 'Nästan klar...'],
  estimatedTime = 3000
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isLoading) return;

    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => 
        (prev + 1) % loadingMessages.length
      );
    }, estimatedTime / loadingMessages.length);

    const timeInterval = setInterval(() => {
      setElapsedTime(prev => prev + 100);
    }, 100);

    return () => {
      clearInterval(messageInterval);
      clearInterval(timeInterval);
      setCurrentMessageIndex(0);
      setElapsedTime(0);
    };
  }, [isLoading, loadingMessages, estimatedTime]);

  const progressPercentage = progress ?? Math.min((elapsedTime / estimatedTime) * 100, 95);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-card border rounded-lg shadow-lg p-6 max-w-sm w-full mx-4 animate-scale-in">
            <div className="text-center space-y-4">
              {/* Animated Loading Icon */}
              <div className="relative">
                <div className="w-12 h-12 mx-auto">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                </div>
              </div>

              {/* Dynamic Loading Message */}
              <div className="animate-fade-in">
                <p className="text-sm font-medium">
                  {loadingMessages[currentMessageIndex]}
                </p>
                {stage && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {stage}
                  </p>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(progressPercentage)}% klar
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div 
        className={cn(
          "transition-all duration-200",
          isLoading ? "opacity-30 scale-[0.98]" : "opacity-100 scale-100"
        )}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * 🎉 SUCCESS ANIMATIONS
 * Celebratory feedback for completed actions
 */
interface SuccessAnimationProps {
  isVisible: boolean;
  type?: 'achievement' | 'completion' | 'milestone' | 'celebration';
  message?: string;
  onComplete?: () => void;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  isVisible,
  type = 'completion',
  message = 'Framgång!',
  onComplete
}) => {
  const iconVariants = {
    achievement: Trophy,
    completion: CheckCircle,
    milestone: Star,
    celebration: Sparkles
  };

  const IconComponent = iconVariants[type];

  const confettiColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border rounded-xl shadow-2xl p-8 text-center max-w-sm mx-4 animate-scale-in">
        {/* Success Icon */}
        <div className="w-16 h-16 mx-auto mb-4 relative animate-[spin_0.6s_ease-out]">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <IconComponent className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          
          {/* Confetti Effect */}
          {type === 'celebration' && (
            <div className="absolute inset-0">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full animate-pulse"
                  style={{ 
                    backgroundColor: confettiColors[i % confettiColors.length],
                    left: '50%',
                    top: '50%',
                    animationDelay: `${0.5 + (i * 0.1)}s`
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Success Message */}
        <div className="animate-fade-in">
          <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
            {message}
          </h3>
          <p className="text-sm text-muted-foreground">
            {type === 'achievement' && 'Du har låst upp en ny prestation!'}
            {type === 'completion' && 'Uppgiften har slutförts framgångsrikt!'}
            {type === 'milestone' && 'Du har nått en viktig milstolpe!'}
            {type === 'celebration' && 'Grattis till ditt framsteg!'}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * 🎯 CONTEXTUAL FEEDBACK HOOK
 * Smart feedback system that adapts to context
 */
export const useContextualFeedback = () => {
  const [feedbackState, setFeedbackState] = useState<{
    isLoading: boolean;
    progress?: number;
    stage?: string;
    success?: boolean;
    error?: string;
  }>({ isLoading: false });

  const showLoading = (stage?: string, progress?: number) => {
    setFeedbackState({ isLoading: true, stage, progress });
  };

  const showSuccess = (message: string = 'Framgång!', type: 'achievement' | 'completion' | 'milestone' | 'celebration' = 'completion') => {
    setFeedbackState({ isLoading: false, success: true });
    
    // Show success animation
    setTimeout(() => {
      setFeedbackState({ isLoading: false });
    }, 3000);

    // Show toast notification
    toast.success(message, {
      icon: <CheckCircle className="h-4 w-4" />,
      duration: 4000,
    });
  };

  const showError = (message: string) => {
    setFeedbackState({ isLoading: false, error: message });
    
    toast.error(message, {
      icon: <AlertCircle className="h-4 w-4" />,
      duration: 5000,
    });

    // Clear error after 5 seconds
    setTimeout(() => {
      setFeedbackState(prev => ({ ...prev, error: undefined }));
    }, 5000);
  };

  const clearFeedback = () => {
    setFeedbackState({ isLoading: false });
  };

  return {
    ...feedbackState,
    showLoading,
    showSuccess,
    showError,
    clearFeedback
  };
};

/**
 * 🌟 INTERACTIVE ELEMENT ENHANCER
 * Adds micro-interactions to buttons and interactive elements
 */
export const InteractiveElement: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  variant?: 'button' | 'card' | 'icon';
}> = ({ children, onClick, className, disabled, variant = 'button' }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !onClick) return;

    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = {
      id: Date.now(),
      x,
      y
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);

    onClick();
  };

  const getHoverClass = () => {
    if (disabled) return '';
    switch (variant) {
      case 'button': return 'hover:scale-[1.02] hover:-translate-y-0.5';
      case 'card': return 'hover:scale-[1.01] hover:-translate-y-1';
      case 'icon': return 'hover:scale-110 hover:rotate-1';
      default: return 'hover:scale-[1.02]';
    }
  };

  const getPressClass = () => {
    if (disabled) return '';
    return isPressed ? 'scale-95' : '';
  };

  return (
    <div
      className={cn(
        'relative cursor-pointer overflow-hidden transition-transform duration-150',
        getHoverClass(),
        getPressClass(),
        className
      )}
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      {children}
      
      {/* Ripple Effects */}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="absolute bg-white/20 rounded-full pointer-events-none animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            animationDuration: '0.6s',
          }}
        />
      ))}
    </div>
  );
};

export default {
  SmartLoading,
  SuccessAnimation,
  useContextualFeedback,
  InteractiveElement
};