/**
 * 🚀 PERFORMANCE OPTIMIZATION UTILITIES
 * 
 * Tools for measuring and optimizing SHIMMS performance
 * Prevents flickering, ensures smooth loading, and tracks metrics
 */

import React from 'react';

// Debounce utility for expensive operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Throttle utility for high-frequency events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Performance measurement
export class PerformanceTracker {
  private marks: Map<string, number> = new Map();
  
  start(name: string) {
    this.marks.set(name, performance.now());
  }
  
  end(name: string): number {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`Performance mark "${name}" not found`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.marks.delete(name);
    
    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
}

export const perfTracker = new PerformanceTracker();

// React component performance utilities
export function measureRender<T extends React.ComponentType<any>>(
  Component: T,
  name: string
): React.ComponentType<any> {
  return React.memo(React.forwardRef((props: any, ref: any) => {
    perfTracker.start(`render-${name}`);
    
    React.useEffect(() => {
      perfTracker.end(`render-${name}`);
    });
    
    return React.createElement(Component, { ...props, ref });
  }));
}

// Image lazy loading with intersection observer
export function useLazyImage(src: string, threshold: number = 0.1) {
  const [imageSrc, setImageSrc] = React.useState<string | undefined>();
  const [isLoaded, setIsLoaded] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src, threshold]);

  React.useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.src = imageSrc;
    }
  }, [imageSrc]);

  return { imgRef, imageSrc, isLoaded };
}

// Smooth page transitions
export function usePageTransition() {
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  
  const startTransition = React.useCallback(() => {
    setIsTransitioning(true);
    // Add transition class to body
    document.body.classList.add('page-transitioning');
  }, []);
  
  const endTransition = React.useCallback(() => {
    setIsTransitioning(false);
    // Remove transition class after animation
    setTimeout(() => {
      document.body.classList.remove('page-transitioning');
    }, 300);
  }, []);
  
  return { isTransitioning, startTransition, endTransition };
}