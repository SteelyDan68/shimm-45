import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileResponsiveProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileContainer: React.FC<MobileResponsiveProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`container-mobile ${className}`}>
      {children}
    </div>
  );
};

export const MobileCard: React.FC<MobileResponsiveProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`card-mobile ${className}`}>
      {children}
    </div>
  );
};

interface MobileTouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const MobileTouchButton: React.FC<MobileTouchButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'md',
  className = "",
  disabled = false,
  type = 'button'
}) => {
  const touchClass = `touch-target-${variant}`;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${touchClass}
        inline-flex items-center justify-center
        rounded-md font-medium transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
        disabled:pointer-events-none disabled:opacity-50
        bg-primary text-primary-foreground hover:bg-primary/90
        active:scale-95 transition-transform
        ${className}
      `}
    >
      {children}
    </button>
  );
};

interface MobileGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export const MobileGrid: React.FC<MobileGridProps> = ({ 
  children, 
  columns = 1,
  className = "" 
}) => {
  const gridClass = columns === 1 ? 'grid-mobile-1' : 'grid-mobile-2';
  
  return (
    <div className={`grid gap-4 ${gridClass} ${className}`}>
      {children}
    </div>
  );
};

interface MobileStackProps {
  children: React.ReactNode;
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
}

export const MobileStack: React.FC<MobileStackProps> = ({ 
  children, 
  spacing = 'md',
  className = "" 
}) => {
  const spaceClass = `space-mobile-${spacing}`;
  
  return (
    <div className={`flex flex-col ${spaceClass} ${className}`}>
      {children}
    </div>
  );
};

interface ResponsiveTextProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({ 
  children, 
  size = 'base',
  className = "" 
}) => {
  const textClass = `text-mobile-${size}`;
  
  return (
    <span className={`${textClass} ${className}`}>
      {children}
    </span>
  );
};

interface ConditionalRenderProps {
  children: React.ReactNode;
  showOn?: 'mobile' | 'desktop' | 'both';
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({ 
  children, 
  showOn = 'both' 
}) => {
  const isMobile = useIsMobile();
  
  if (showOn === 'mobile' && !isMobile) return null;
  if (showOn === 'desktop' && isMobile) return null;
  
  return <>{children}</>;
};

export const MobileOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="mobile-only">{children}</div>;
};

export const DesktopOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="hidden-mobile">{children}</div>;
};

interface MobileSlideAnimationProps {
  children: React.ReactNode;
  direction?: 'up' | 'fade';
  className?: string;
}

export const MobileSlideAnimation: React.FC<MobileSlideAnimationProps> = ({ 
  children, 
  direction = 'fade',
  className = "" 
}) => {
  const animationClass = direction === 'up' ? 'animate-slide-up-mobile' : 'animate-fade-in-mobile';
  
  return (
    <div className={`${animationClass} ${className}`}>
      {children}
    </div>
  );
};