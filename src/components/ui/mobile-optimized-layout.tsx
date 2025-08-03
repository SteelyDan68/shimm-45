import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * 📱 MOBILE-OPTIMIZED LAYOUT WRAPPER
 * - Automatically applies mobile-first optimizations
 * - Handles touch gestures and scroll behavior
 * - Responsive spacing and typography
 */
export const MobileOptimizedLayout: React.FC<MobileOptimizedLayoutProps> = ({ 
  children, 
  className = "" 
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      "w-full min-h-screen",
      // Mobile-first base styles
      "overflow-x-hidden",
      "-webkit-overflow-scrolling-touch",
      // Touch optimizations
      isMobile && [
        "touch-action-manipulation",
        "overscroll-behavior-contain",
        "scroll-behavior-auto", // Disable smooth scroll on mobile for better performance
      ],
      // Desktop optimizations
      !isMobile && [
        "scroll-behavior-smooth",
      ],
      className
    )}>
      {children}
    </div>
  );
};

interface MobileContentWrapperProps {
  children: React.ReactNode;
  className?: string;
  useMobilePadding?: boolean;
}

/**
 * 📱 MOBILE CONTENT WRAPPER
 * - Responsive padding and margins
 * - Safe area handling for mobile devices
 * - Optimized spacing for different screen sizes
 */
export const MobileContentWrapper: React.FC<MobileContentWrapperProps> = ({ 
  children, 
  className = "",
  useMobilePadding = true
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      "w-full",
      // Mobile-first padding
      useMobilePadding && [
        "px-4 py-2", // Base mobile padding
        "sm:px-6 sm:py-4", // Small screens
        "md:px-8 md:py-6", // Medium screens
        "lg:px-12 lg:py-8", // Large screens
      ],
      // Safe area for mobile devices with notches
      isMobile && [
        "env(safe-area-inset-top)",
        "env(safe-area-inset-bottom)",
        "env(safe-area-inset-left)", 
        "env(safe-area-inset-right)",
      ],
      className
    )}>
      {children}
    </div>
  );
};

interface MobileStackProps {
  children: React.ReactNode;
  spacing?: 'tight' | 'normal' | 'relaxed' | 'loose';
  className?: string;
}

/**
 * 📱 MOBILE-OPTIMIZED STACK
 * - Responsive vertical spacing
 * - Touch-friendly gaps between elements
 * - Automatic mobile adjustments
 */
export const MobileStack: React.FC<MobileStackProps> = ({ 
  children, 
  spacing = 'normal',
  className = "" 
}) => {
  const isMobile = useIsMobile();

  const getSpacing = () => {
    const mobileSpacings = {
      tight: 'space-y-2',
      normal: 'space-y-4',
      relaxed: 'space-y-6',
      loose: 'space-y-8'
    };

    const desktopSpacings = {
      tight: 'space-y-3',
      normal: 'space-y-6',
      relaxed: 'space-y-8',
      loose: 'space-y-12'
    };

    return isMobile ? mobileSpacings[spacing] : desktopSpacings[spacing];
  };

  return (
    <div className={cn(
      "flex flex-col",
      getSpacing(),
      className
    )}>
      {children}
    </div>
  );
};

interface MobileGridProps {
  children: React.ReactNode;
  columns?: {
    mobile: 1 | 2;
    tablet: 1 | 2 | 3;
    desktop: 1 | 2 | 3 | 4;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * 📱 MOBILE-RESPONSIVE GRID
 * - Breakpoint-aware column layout
 * - Touch-friendly spacing
 * - Automatic mobile optimizations
 */
export const MobileGrid: React.FC<MobileGridProps> = ({ 
  children, 
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className = "" 
}) => {
  const gapClasses = {
    sm: 'gap-2 md:gap-3',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8'
  };

  const getGridCols = () => {
    return [
      `grid-cols-${columns.mobile}`,
      `md:grid-cols-${columns.tablet}`,
      `lg:grid-cols-${columns.desktop}`
    ].join(' ');
  };

  return (
    <div className={cn(
      "grid",
      getGridCols(),
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
};

/**
 * 📱 MOBILE VIEWPORT META HELPER
 * - Ensures proper mobile viewport settings
 * - Prevents zoom on form inputs
 * - Optimizes for mobile experience
 */
export const useMobileViewport = () => {
  React.useEffect(() => {
    // Ensure proper viewport meta tag
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      document.head.appendChild(viewportMeta);
    }
    
    viewportMeta.setAttribute(
      'content', 
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    );

    // Add touch-action CSS for better touch handling
    document.body.style.touchAction = 'manipulation';
    
    return () => {
      document.body.style.touchAction = '';
    };
  }, []);
};