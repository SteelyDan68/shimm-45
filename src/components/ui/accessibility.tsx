import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface AccessibleLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
  variant?: 'spinner' | 'dots' | 'pulse';
}

/**
 * 🔄 ACCESSIBLE LOADING COMPONENT
 * - WCAG compliant loading indicators
 * - Screen reader friendly
 * - Keyboard navigation support
 * - Mobile optimized
 */
export const AccessibleLoading: React.FC<AccessibleLoadingProps> = ({
  size = 'md',
  className = '',
  label = 'Laddar innehåll...',
  variant = 'spinner'
}) => {
  const isMobile = useIsMobile();

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const mobileSizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  const currentSizeClass = isMobile ? mobileSizeClasses[size] : sizeClasses[size];

  if (variant === 'spinner') {
    return (
      <div 
        className={cn("flex items-center justify-center", className)}
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        <div
          className={cn(
            "animate-spin rounded-full border-2 border-current border-t-transparent",
            currentSizeClass
          )}
          aria-hidden="true"
        />
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div 
        className={cn("flex items-center justify-center space-x-1", className)}
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "bg-current rounded-full animate-pulse",
              size === 'sm' ? 'h-1 w-1' : size === 'md' ? 'h-2 w-2' : 'h-3 w-3'
            )}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1s'
            }}
            aria-hidden="true"
          />
        ))}
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div 
        className={cn("flex items-center justify-center", className)}
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        <div
          className={cn(
            "bg-current rounded-full animate-pulse",
            currentSizeClass
          )}
          aria-hidden="true"
        />
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return null;
};

interface AccessibleSkipLinkProps {
  href: string;
  children: React.ReactNode;
}

/**
 * ⚡ ACCESSIBLE SKIP LINK
 * - Keyboard navigation support
 * - Screen reader optimized
 * - WCAG compliant focus management
 */
export const AccessibleSkipLink: React.FC<AccessibleSkipLinkProps> = ({
  href,
  children
}) => {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4",
        "bg-primary text-primary-foreground px-4 py-2 rounded-md",
        "focus:z-50 focus:outline-none focus:ring-2 focus:ring-ring",
        "transition-all duration-200"
      )}
      tabIndex={0}
    >
      {children}
    </a>
  );
};

interface AccessibleAnnouncementProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number;
}

/**
 * 📢 ACCESSIBLE ANNOUNCEMENT
 * - Screen reader announcements
 * - ARIA live regions
 * - Auto-clearing messages
 */
export const AccessibleAnnouncement: React.FC<AccessibleAnnouncementProps> = ({
  message,
  priority = 'polite',
  clearAfter = 5000
}) => {
  const [currentMessage, setCurrentMessage] = React.useState(message);

  React.useEffect(() => {
    setCurrentMessage(message);
    
    if (clearAfter > 0) {
      const timer = setTimeout(() => {
        setCurrentMessage('');
      }, clearAfter);
      
      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <div
      className="sr-only"
      aria-live={priority}
      aria-atomic="true"
      role="status"
    >
      {currentMessage}
    </div>
  );
};

interface KeyboardNavigationIndicatorProps {
  isVisible: boolean;
  className?: string;
}

/**
 * ⌨️ KEYBOARD NAVIGATION INDICATOR
 * - Visual focus indicators
 * - Keyboard-only navigation support
 * - WCAG contrast compliance
 */
export const KeyboardNavigationIndicator: React.FC<KeyboardNavigationIndicatorProps> = ({
  isVisible,
  className = ''
}) => {
  const [isKeyboardUser, setIsKeyboardUser] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  if (!isVisible || !isKeyboardUser) return null;

  return (
    <div
      className={cn(
        "fixed top-4 right-4 bg-primary text-primary-foreground",
        "px-3 py-2 rounded-md text-sm font-medium z-50",
        "shadow-lg border-2 border-ring",
        className
      )}
      role="status"
      aria-live="polite"
    >
      Använd Tab för att navigera
    </div>
  );
};

// Custom hook for keyboard navigation management
export const useKeyboardNavigation = () => {
  const [focusedElement, setFocusedElement] = React.useState<Element | null>(null);
  const [isKeyboardUser, setIsKeyboardUser] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
      }
      
      // Escape key clears focus
      if (e.key === 'Escape') {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    const handleFocusIn = (e: FocusEvent) => {
      setFocusedElement(e.target as Element);
    };

    const handleFocusOut = () => {
      setFocusedElement(null);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const focusElement = React.useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  }, []);

  const announceToScreenReader = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return {
    focusedElement,
    isKeyboardUser,
    focusElement,
    announceToScreenReader
  };
};