/**
 * 🚀 MEMORY OPTIMIZED COMPONENT PATTERNS
 * Förhindrar memory leaks och optimerar component lifecycle
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react';

/**
 * 🎯 CLEANUP HOOK
 * Automatisk cleanup av eventListeners, timers, och subscriptions
 */
export const useCleanup = () => {
  const cleanupFunctions = useRef<Array<() => void>>([]);

  const addCleanup = useCallback((cleanupFn: () => void) => {
    cleanupFunctions.current.push(cleanupFn);
  }, []);

  // Automatic cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupFunctions.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.warn('Cleanup function failed:', error);
        }
      });
      cleanupFunctions.current = [];
    };
  }, []);

  return { addCleanup };
};

/**
 * 🎯 SAFE ASYNC HOOK
 * Förhindrar setState på unmounted components
 */
export const useSafeAsync = () => {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback(
    (setState: React.Dispatch<React.SetStateAction<any>>, value: any) => {
      if (isMountedRef.current) {
        setState(value);
      }
    },
    []
  );

  const isMounted = useCallback(() => isMountedRef.current, []);

  return { safeSetState, isMounted };
};

/**
 * 🎯 DEBOUNCED STATE HOOK
 * Optimerar state updates för bättre performance
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = React.useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = React.useState<T>(initialValue);
  const { addCleanup } = useCleanup();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    addCleanup(() => clearTimeout(timer));

    return () => clearTimeout(timer);
  }, [value, delay, addCleanup]);

  return [value, debouncedValue, setValue];
}

/**
 * 🎯 OPTIMIZED EVENT LISTENER HOOK
 * Minimerar event listener overhead
 */
export const useOptimizedEventListener = (
  eventName: string,
  handler: (event: Event) => void,
  element?: Element | Window | null,
  options?: AddEventListenerOptions
) => {
  const savedHandler = useRef(handler);
  const { addCleanup } = useCleanup();

  // Update handler ref när den ändras
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const targetElement = element || window;
    if (!targetElement?.addEventListener) return;

    // Optimized event handler med memoization
    const eventHandler = (event: Event) => savedHandler.current(event);

    targetElement.addEventListener(eventName, eventHandler, options);

    const cleanup = () => {
      targetElement.removeEventListener(eventName, eventHandler, options);
    };

    addCleanup(cleanup);
    return cleanup;
  }, [eventName, element, options, addCleanup]);
};

/**
 * 🎯 INTERSECTION OBSERVER HOOK
 * Optimerad visibility tracking för lazy loading
 */
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [entry, setEntry] = React.useState<IntersectionObserverEntry | null>(null);
  const [node, setNode] = React.useState<Element | null>(null);
  const { addCleanup } = useCleanup();

  // Memoized observer för att undvika re-creation
  const observer = useMemo(() => {
    if (!node) return null;
    
    const obs = new IntersectionObserver(([entry]) => {
      setEntry(entry);
    }, options);

    return obs;
  }, [node, options.threshold, options.rootMargin]);

  useEffect(() => {
    if (!observer || !node) return;

    observer.observe(node);

    const cleanup = () => observer.disconnect();
    addCleanup(cleanup);

    return cleanup;
  }, [observer, node, addCleanup]);

  return [setNode, entry] as const;
};

/**
 * 🎯 MEMORY OPTIMIZED LIST COMPONENT
 * Virtualiserad lista för stora datasets
 */
interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  overscan?: number;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor,
  overscan = 5
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleItemCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    startIndex + visibleItemCount + overscan * 2
  );

  const visibleItems = items.slice(startIndex, endIndex);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={keyExtractor(item, startIndex + index)}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 🎯 COMPONENT MEMORY USAGE TRACKER
 * Development tool för att track memory usage
 */
export const useMemoryTracker = (componentName: string) => {
  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());

  // Track renders in development
  if (process.env.NODE_ENV === 'development') {
    renderCount.current++;
    
    useEffect(() => {
      console.log(`[${componentName}] Mounted at`, new Date(mountTime.current));
      
      return () => {
        const lifespan = Date.now() - mountTime.current;
        console.log(`[${componentName}] Unmounted after ${lifespan}ms, ${renderCount.current} renders`);
      };
    }, [componentName]);
  }

  return {
    renderCount: renderCount.current,
    lifespan: Date.now() - mountTime.current
  };
};

export default {
  useCleanup,
  useSafeAsync,
  useDebouncedState,
  useOptimizedEventListener,
  useIntersectionObserver,
  VirtualizedList,
  useMemoryTracker
};