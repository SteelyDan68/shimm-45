/**
 * 🚀 ADVANCED PERFORMANCE OPTIMIZATION SYSTEM V2
 * SCRUM-TEAM VÄRLDSKLASS IMPLEMENTATION
 * 
 * Fokus: Memory efficiency, render optimization, bundle size reduction
 * Budget: 1 miljard kronor development standard
 */

import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { logger } from './productionLogger';

/**
 * 💾 MEMORY MANAGEMENT UTILITIES
 */
export const useMemoryOptimization = () => {
  const memoryRef = useRef<Map<string, any>>(new Map());
  const cleanupFunctions = useRef<Set<() => void>>(new Set());

  // Register cleanup function
  const registerCleanup = useCallback((cleanupFn: () => void) => {
    cleanupFunctions.current.add(cleanupFn);
    return () => cleanupFunctions.current.delete(cleanupFn);
  }, []);

  // Clear all memory references
  const clearMemory = useCallback(() => {
    memoryRef.current.clear();
    cleanupFunctions.current.forEach(cleanup => {
      try { cleanup(); } catch (e) { logger.error('Cleanup failed', e); }
    });
    cleanupFunctions.current.clear();
  }, []);

  // Memory-safe setter
  const setMemoryValue = useCallback((key: string, value: any) => {
    memoryRef.current.set(key, value);
    
    // Automatic cleanup after 5 minutes to prevent memory leaks
    const timeoutId = setTimeout(() => {
      memoryRef.current.delete(key);
    }, 5 * 60 * 1000);

    registerCleanup(() => clearTimeout(timeoutId));
  }, [registerCleanup]);

  // Auto-cleanup on unmount
  useEffect(() => {
    return clearMemory;
  }, [clearMemory]);

  return {
    setMemoryValue,
    getMemoryValue: (key: string) => memoryRef.current.get(key),
    clearMemory,
    registerCleanup
  };
};

/**
 * 🔄 SMART RE-RENDER PREVENTION
 */
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList = []
): T => {
  const callbackRef = useRef<T>(callback);
  const stableDepsRef = useRef<React.DependencyList>(deps);

  // Update ref only when dependencies actually change
  const depsChanged = useMemo(() => {
    if (stableDepsRef.current.length !== deps.length) return true;
    return deps.some((dep, index) => dep !== stableDepsRef.current[index]);
  }, deps);

  if (depsChanged) {
    callbackRef.current = callback;
    stableDepsRef.current = deps;
  }

  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, []) as T;
};

/**
 * 📊 EXPENSIVE CALCULATION OPTIMIZATION
 */
export const useExpensiveCalculation = <T>(
  calculation: () => T,
  deps: React.DependencyList,
  cacheKey?: string
): T => {
  const cacheRef = useRef<Map<string, { value: T; deps: React.DependencyList }>>(new Map());
  
  return useMemo(() => {
    const key = cacheKey || JSON.stringify(deps);
    const cached = cacheRef.current.get(key);
    
    // Check if cached value is still valid
    if (cached && cached.deps.every((dep, i) => dep === deps[i])) {
      return cached.value;
    }
    
    // Calculate new value
    const startTime = performance.now();
    const result = calculation();
    const endTime = performance.now();
    
    // Log performance in development
    if (process.env.NODE_ENV === 'development' && endTime - startTime > 100) {
      logger.warn(`Expensive calculation took ${endTime - startTime}ms`, { cacheKey });
    }
    
    // Cache the result
    cacheRef.current.set(key, { value: result, deps: [...deps] });
    
    // Cleanup old cache entries (keep last 10)
    if (cacheRef.current.size > 10) {
      const firstKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(firstKey);
    }
    
    return result;
  }, deps);
};

/**
 * 🎯 COMPONENT MEMOIZATION HELPER
 */
export const createMemoizedComponent = <P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) => {
  const MemoizedComponent = React.memo(Component, propsAreEqual);
  MemoizedComponent.displayName = `Memoized(${Component.displayName || Component.name})`;
  return MemoizedComponent;
};

/**
 * 🚀 VIRTUAL SCROLLING V2 - ENHANCED
 */
interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  dynamicHeight?: boolean;
  estimatedItemHeight?: number;
}

export const useVirtualScrollingV2 = <T>(
  items: T[],
  config: VirtualScrollConfig
) => {
  const {
    itemHeight,
    containerHeight,
    overscan = 5,
    dynamicHeight = false,
    estimatedItemHeight = itemHeight
  } = config;

  const [scrollTop, setScrollTop] = useState(0);
  const heightsRef = useRef<Map<number, number>>(new Map());
  const { registerCleanup } = useMemoryOptimization();

  // Calculate visible range with dynamic heights
  const visibleRange = useMemo(() => {
    if (!dynamicHeight) {
      const visibleItemCount = Math.ceil(containerHeight / itemHeight);
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const endIndex = Math.min(items.length, startIndex + visibleItemCount + overscan * 2);
      
      return {
        startIndex,
        endIndex,
        visibleItems: items.slice(startIndex, endIndex),
        totalHeight: items.length * itemHeight,
        offsetY: startIndex * itemHeight
      };
    }

    // Dynamic height calculation
    let currentOffset = 0;
    let startIndex = 0;
    let endIndex = 0;
    
    // Find start index
    for (let i = 0; i < items.length; i++) {
      const height = heightsRef.current.get(i) || estimatedItemHeight;
      if (currentOffset + height > scrollTop) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
      currentOffset += height;
    }
    
    // Find end index
    currentOffset = 0;
    for (let i = startIndex; i < items.length; i++) {
      const height = heightsRef.current.get(i) || estimatedItemHeight;
      currentOffset += height;
      
      if (currentOffset > scrollTop + containerHeight + overscan * estimatedItemHeight) {
        endIndex = i + 1;
        break;
      }
    }
    
    if (endIndex === 0) endIndex = items.length;
    
    // Calculate total height
    const totalHeight = items.reduce((sum, _, index) => {
      return sum + (heightsRef.current.get(index) || estimatedItemHeight);
    }, 0);
    
    // Calculate offset
    let offsetY = 0;
    for (let i = 0; i < startIndex; i++) {
      offsetY += heightsRef.current.get(i) || estimatedItemHeight;
    }
    
    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex),
      totalHeight,
      offsetY
    };
  }, [items, scrollTop, containerHeight, itemHeight, overscan, dynamicHeight, estimatedItemHeight]);

  // Optimized scroll handler
  const handleScroll = useStableCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
  }, []);

  // Height measurement for dynamic height
  const measureHeight = useCallback((index: number, height: number) => {
    if (dynamicHeight) {
      heightsRef.current.set(index, height);
    }
  }, [dynamicHeight]);

  // Cleanup
  useEffect(() => {
    registerCleanup(() => {
      heightsRef.current.clear();
    });
  }, [registerCleanup]);

  return {
    ...visibleRange,
    handleScroll,
    measureHeight
  };
};

/**
 * 📱 INTERSECTION OBSERVER OPTIMIZATION
 */
export const useIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
) => {
  const observer = useRef<IntersectionObserver | null>(null);
  const { registerCleanup } = useMemoryOptimization();

  const observe = useCallback((element: Element) => {
    if (observer.current) {
      observer.current.observe(element);
    }
  }, []);

  const unobserve = useCallback((element: Element) => {
    if (observer.current) {
      observer.current.unobserve(element);
    }
  }, []);

  useEffect(() => {
    observer.current = new IntersectionObserver(callback, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    });

    const cleanup = () => {
      if (observer.current) {
        observer.current.disconnect();
        observer.current = null;
      }
    };

    registerCleanup(cleanup);
    return cleanup;
  }, [callback, options, registerCleanup]);

  return { observe, unobserve };
};

/**
 * 🔧 BUNDLE SIZE OPTIMIZATION UTILITIES
 */
export const lazyImportWithPreload = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  preloadCondition?: () => boolean
) => {
  const LazyComponent = React.lazy(importFn);
  
  // Preload if condition is met
  if (preloadCondition && preloadCondition()) {
    importFn().catch(logger.error);
  }
  
  return LazyComponent;
};

/**
 * 🎯 PERFORMANCE MONITORING HOOK V2
 */
export const usePerformanceMonitoringV2 = (componentName: string) => {
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef(Date.now());
  const lastRenderTimeRef = useRef(Date.now());
  
  renderCountRef.current += 1;
  const currentTime = Date.now();
  const timeSinceLastRender = currentTime - lastRenderTimeRef.current;
  const totalLifetime = currentTime - mountTimeRef.current;
  lastRenderTimeRef.current = currentTime;

  // Performance warnings
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Too many renders warning
      if (renderCountRef.current > 50) {
        logger.warn(`🚨 Performance Alert: ${componentName} has rendered ${renderCountRef.current} times`, {
          lifetime: totalLifetime,
          avgRenderTime: totalLifetime / renderCountRef.current
        });
      }
      
      // Frequent re-renders warning
      if (timeSinceLastRender < 16 && renderCountRef.current > 5) {
        logger.warn(`⚡ Rapid re-renders detected in ${componentName}`, {
          renderCount: renderCountRef.current,
          timeSinceLastRender
        });
      }
    }
  });

  return {
    renderCount: renderCountRef.current,
    timeSinceLastRender,
    totalLifetime,
    avgRenderTime: totalLifetime / renderCountRef.current
  };
};

/**
 * 🧹 AUTO CLEANUP HOOK
 */
export const useAutoCleanup = () => {
  const cleanupFunctions = useRef<Set<() => void>>(new Set());
  
  const registerCleanup = useCallback((fn: () => void) => {
    cleanupFunctions.current.add(fn);
    return () => cleanupFunctions.current.delete(fn);
  }, []);

  useEffect(() => {
    return () => {
      cleanupFunctions.current.forEach(cleanup => {
        try { cleanup(); } catch (e) { logger.error('Cleanup error', e); }
      });
      cleanupFunctions.current.clear();
    };
  }, []);

  return { registerCleanup };
};

/**
 * 📊 MEMORY USAGE TRACKER
 */
export const useMemoryTracker = (componentName: string) => {
  const { registerCleanup } = useAutoCleanup();
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const startMemory = (performance as any).memory.usedJSHeapSize;
      
      const cleanup = () => {
        const endMemory = (performance as any).memory.usedJSHeapSize;
        const memoryDiff = endMemory - startMemory;
        
        if (memoryDiff > 1024 * 1024) { // > 1MB
          logger.warn(`💾 Memory usage increased by ${Math.round(memoryDiff / 1024 / 1024)}MB in ${componentName}`);
        }
      };
      
      registerCleanup(cleanup);
      return cleanup;
    }
  }, [componentName, registerCleanup]);
};

export default {
  useMemoryOptimization,
  useStableCallback,
  useExpensiveCalculation,
  createMemoizedComponent,
  useVirtualScrollingV2,
  useIntersectionObserver,
  lazyImportWithPreload,
  usePerformanceMonitoringV2,
  useAutoCleanup,
  useMemoryTracker
};
