import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';

/**
 * 🚀 PERFORMANCE OPTIMIZATION UTILITIES
 * - Debouncing för API calls
 * - Throttling för scroll events
 * - Memoization helpers
 * - Virtual scrolling utilities
 */

// Debounce hook för att minimera API calls
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
};

// Throttle hook för scroll events och andra högfrekventa events
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callback(...args);
        }, delay - (now - lastCallRef.current));
      }
    }) as T,
    [callback, delay]
  );
};

// Memoized selector för stora listor
export const useMemoizedSelector = <T, R>(
  data: T[],
  selector: (item: T) => R,
  deps: any[] = []
): R[] => {
  return useMemo(
    () => data.map(selector),
    [data, selector, ...deps] // eslint-disable-line react-hooks/exhaustive-deps
  );
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());

  renderCountRef.current += 1;
  const currentTime = Date.now();
  const timeSinceLastRender = currentTime - lastRenderTimeRef.current;
  lastRenderTimeRef.current = currentTime;

  // Log performance warnings i utvecklingsmiljö
  if (process.env.NODE_ENV === 'development') {
    if (renderCountRef.current > 10 && timeSinceLastRender < 100) {
      console.warn(
        `⚠️ Performance Warning: ${componentName} rendered ${renderCountRef.current} times. Consider memoization.`
      );
    }
  }

  return {
    renderCount: renderCountRef.current,
    timeSinceLastRender
  };
};

// Virtual scrolling utility för stora listor
export const useVirtualScrolling = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItemCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleItemCount + overscan * 2);

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex
  };
};

// Bundle splitting utilities - removed for simplicity

// Memory cleanup utilities
export const useCleanup = (cleanupFn: () => void) => {
  React.useEffect(() => {
    return cleanupFn;
  }, [cleanupFn]);
};

// Image lazy loading hook
export const useLazyImage = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  return {
    imgRef,
    imageSrc,
    isLoaded,
    handleLoad
  };
};