/**
 * 🚀 PERFORMANCE OPTIMIZATION HOOKS
 * Samlar alla prestanda-optimeringsverktåg för NCCS
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { logger, perfLogger } from '@/utils/productionLogger';

// Re-export från befintliga performance hooks
export {
  useDebounce,
  useThrottle,
  useMemoizedSelector,
  usePerformanceMonitor,
  useVirtualScrolling,
  useCleanup,
  useLazyImage
} from '@/utils/performanceOptimization';

export {
  useOptimizedCallback,
  useOptimizedMemo,
  useDeepMemo,
  useOptimizedState,
  useBatchedUpdates,
  useRenderOptimization,
  useCachedAsync,
  useIntersectionObserver
} from '@/hooks/usePerformanceOptimization';

/**
 * Hook för att optimera konsolloggning under utveckling
 */
export const useProductionLogger = () => {
  return useMemo(() => ({
    debug: (message: string, context?: Record<string, any>) => logger.debug(message, context),
    info: (message: string, context?: Record<string, any>) => logger.info(message, context),
    warn: (message: string, context?: Record<string, any>) => logger.warn(message, context),
    error: (message: string, error?: Error, context?: Record<string, any>) => logger.error(message, error, context),
    success: (message: string, context?: Record<string, any>) => logger.success(message, context),
    performance: perfLogger
  }), []);
};

/**
 * Hook för att mäta komponent-prestanda automatiskt
 */
export const useAutoPerformanceTracking = (componentName: string) => {
  const mountTime = useRef(Date.now());
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current++;
    
    if (renderCount.current === 1) {
      // Första render
      perfLogger.start(`${componentName}_mount`);
    } else {
      // Efterföljande renders
      const now = Date.now();
      const timeSinceMount = now - mountTime.current;
      
      if (timeSinceMount > 100) {
        logger.warn(`Slow component re-render detected: ${componentName}`, {
          renderCount: renderCount.current,
          timeSinceMount,
          component: componentName
        });
      }
    }
    
    return () => {
      if (renderCount.current === 1) {
        perfLogger.end(`${componentName}_mount`);
      }
    };
  });
  
  useEffect(() => {
    return () => {
      logger.info(`Component unmounting: ${componentName}`, {
        totalRenders: renderCount.current,
        totalLifetime: Date.now() - mountTime.current
      });
    };
  }, [componentName]);
};

/**
 * Hook för intelligent state batching
 */
export const useSmartBatching = () => {
  const batchedUpdates = useRef<(() => void)[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const batchUpdate = useCallback((updateFn: () => void) => {
    batchedUpdates.current.push(updateFn);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      const updates = batchedUpdates.current.slice();
      batchedUpdates.current = [];
      
      perfLogger.start('batch_update');
      updates.forEach(update => update());
      perfLogger.end('batch_update');
    }, 16); // 16ms ≈ 60fps
  }, []);
  
  return { batchUpdate };
};