/**
 * 🚀 ENHANCED PERFORMANCE OPTIMIZATION HOOKS
 * SCRUM-TEAM ADVANCED MEMOIZATION AND PERFORMANCE MONITORING
 */
import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { logger } from '@/utils/productionLogger';

// Re-export original hooks with enhancements
export { 
  useDebounce, 
  useThrottle, 
  useMemoizedSelector,
  usePerformanceMonitor,
  useVirtualScrolling,
  useCleanup,
  useLazyImage 
} from '@/utils/performanceOptimization';

/**
 * Enhanced useCallback with dependency tracking
 */
export const useOptimizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  debugName?: string
): T => {
  const prevDepsRef = useRef<React.DependencyList>();
  const callbackRef = useRef<T>();

  // Track dependency changes in development
  if (process.env.NODE_ENV === 'development' && debugName) {
    if (prevDepsRef.current) {
      const changedDeps = deps.map((dep, index) => 
        dep !== prevDepsRef.current?.[index]
      );
      
      if (changedDeps.some(Boolean)) {
        logger.debug(`useOptimizedCallback[${debugName}] dependencies changed`, {
          changedIndices: changedDeps.map((changed, i) => changed ? i : -1).filter(i => i !== -1),
          deps
        });
      }
    }
    prevDepsRef.current = deps;
  }

  return useCallback(callback, deps);
};

/**
 * Enhanced useMemo with performance tracking
 */
export const useOptimizedMemo = <T>(
  factory: () => T,
  deps: React.DependencyList,
  debugName?: string
): T => {
  const startTimeRef = useRef<number>();
  const renderCountRef = useRef(0);

  if (process.env.NODE_ENV === 'development') {
    startTimeRef.current = performance.now();
    renderCountRef.current++;
  }

  const result = useMemo(() => {
    const computationStart = performance.now();
    const value = factory();
    const computationTime = performance.now() - computationStart;

    if (process.env.NODE_ENV === 'development' && debugName) {
      if (computationTime > 5) { // Warn if computation takes > 5ms
        logger.warn(`useOptimizedMemo[${debugName}] slow computation: ${computationTime.toFixed(2)}ms`, {
          renderCount: renderCountRef.current
        });
      }
    }

    return value;
  }, deps);

  return result;
};

/**
 * Smart memo for complex objects with deep comparison
 */
export const useDeepMemo = <T>(
  factory: () => T,
  deps: React.DependencyList
): T => {
  const previousValue = useRef<T>();
  const previousDeps = useRef<React.DependencyList>();

  return useMemo(() => {
    // Deep comparison of dependencies
    const depsChanged = !previousDeps.current || 
      deps.length !== previousDeps.current.length ||
      deps.some((dep, index) => {
        const prevDep = previousDeps.current?.[index];
        return JSON.stringify(dep) !== JSON.stringify(prevDep);
      });

    if (depsChanged) {
      previousValue.current = factory();
      previousDeps.current = deps;
    }

    return previousValue.current as T;
  }, deps);
};

/**
 * Optimized state updater that prevents unnecessary re-renders
 */
export const useOptimizedState = <T>(
  initialState: T | (() => T),
  compareFn?: (prev: T, next: T) => boolean
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState(initialState);
  
  const optimizedSetState = useCallback((
    value: React.SetStateAction<T>
  ) => {
    setState(prevState => {
      const nextState = typeof value === 'function' 
        ? (value as (prevState: T) => T)(prevState)
        : value;

      // Use custom comparison or shallow comparison
      const shouldUpdate = compareFn 
        ? !compareFn(prevState, nextState)
        : prevState !== nextState;

      return shouldUpdate ? nextState : prevState;
    });
  }, [compareFn]);

  return [state, optimizedSetState];
};

/**
 * Batch state updates to reduce re-renders
 */
export const useBatchedUpdates = () => {
  const updatesRef = useRef<(() => void)[]>([]);
  const frameRef = useRef<number>();

  const batchUpdate = useCallback((updateFn: () => void) => {
    updatesRef.current.push(updateFn);

    if (!frameRef.current) {
      frameRef.current = requestAnimationFrame(() => {
        // Execute all batched updates
        const updates = updatesRef.current;
        updatesRef.current = [];
        frameRef.current = undefined;

        updates.forEach(update => update());
      });
    }
  }, []);

  const cancelBatch = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = undefined;
      updatesRef.current = [];
    }
  }, []);

  useEffect(() => {
    return cancelBatch;
  }, [cancelBatch]);

  return { batchUpdate, cancelBatch };
};

/**
 * Intelligent component re-render prevention
 */
export const useRenderOptimization = (componentName: string) => {
  const renderCountRef = useRef(0);
  const lastRenderTime = useRef(Date.now());
  const propsHashRef = useRef<string>('');

  const trackRender = useCallback((props?: any) => {
    renderCountRef.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    // Calculate props hash for comparison
    const currentPropsHash = props ? JSON.stringify(props) : '';
    const propsChanged = currentPropsHash !== propsHashRef.current;
    propsHashRef.current = currentPropsHash;

    // Log performance warnings in development
    if (process.env.NODE_ENV === 'development') {
      if (timeSinceLastRender < 16 && !propsChanged) { // Less than one frame and no prop changes
        logger.warn(`🔄 ${componentName}: Rapid re-render without prop changes (${timeSinceLastRender}ms)`, {
          renderCount: renderCountRef.current,
          propsChanged
        });
      }

      if (renderCountRef.current > 20 && timeSinceLastRender < 1000) {
        logger.warn(`🔄 ${componentName}: High render frequency (${renderCountRef.current} renders in <1s)`, {
          averageTime: 1000 / renderCountRef.current
        });
      }
    }

    return {
      renderCount: renderCountRef.current,
      timeSinceLastRender,
      propsChanged
    };
  }, [componentName]);

  return { trackRender };
};

/**
 * Async operation with caching and deduplication
 */
export const useCachedAsync = <T, Args extends any[]>(
  asyncFn: (...args: Args) => Promise<T>,
  cacheKey: string,
  cacheTime: number = 5 * 60 * 1000 // 5 minutes default
) => {
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const pendingRef = useRef<Map<string, Promise<T>>>(new Map());
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (...args: Args): Promise<T> => {
    const key = `${cacheKey}_${JSON.stringify(args)}`;
    const now = Date.now();

    // Check cache first
    const cached = cacheRef.current.get(key);
    if (cached && (now - cached.timestamp) < cacheTime) {
      return cached.data;
    }

    // Check if request is already pending (deduplication)
    const pending = pendingRef.current.get(key);
    if (pending) {
      return pending;
    }

    setLoading(true);
    setError(null);

    const promise = asyncFn(...args)
      .then(data => {
        // Cache the result
        cacheRef.current.set(key, { data, timestamp: now });
        // Remove from pending
        pendingRef.current.delete(key);
        setLoading(false);
        return data;
      })
      .catch(err => {
        pendingRef.current.delete(key);
        setError(err);
        setLoading(false);
        throw err;
      });

    // Add to pending requests
    pendingRef.current.set(key, promise);
    
    return promise;
  }, [asyncFn, cacheKey, cacheTime]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return { execute, loading, error, clearCache };
};

/**
 * Intersection Observer hook for lazy loading
 */
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [hasIntersected, options]);

  return { targetRef, isIntersecting, hasIntersected };
};