/**
 * 🚀 OPTIMIZED REACT STATE MANAGEMENT
 * Sprint 2: Avancerad state-optimering för miljard-kronors prestanda
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { logger, perfLogger } from '@/utils/productionLogger';

interface StateUpdateInfo {
  timestamp: number;
  prevValue: any;
  newValue: any;
  updateSource: string;
}

interface OptimizedStateOptions<T> {
  enableLogging?: boolean;
  enablePerformanceTracking?: boolean;
  updateThrottleMs?: number;
  customComparator?: (prev: T, next: T) => boolean;
  debugName?: string;
}

/**
 * Ultra-optimerad useState hook med prestanda-tracking
 */
export function useOptimizedState<T>(
  initialValue: T,
  options: OptimizedStateOptions<T> = {}
) {
  const {
    enableLogging = import.meta.env.DEV,
    enablePerformanceTracking = true,
    updateThrottleMs = 0,
    customComparator,
    debugName = 'OptimizedState'
  } = options;

  const [state, setState] = useState<T>(initialValue);
  const updateHistory = useRef<StateUpdateInfo[]>([]);
  const lastUpdateTime = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const updateCount = useRef<number>(0);

  // Performance tracking
  useEffect(() => {
    renderCount.current++;
    if (enablePerformanceTracking && renderCount.current > 1) {
      perfLogger.trackPerformance(`${debugName}_render_frequency`, renderCount.current);
      
      // Varna för onödiga re-renders
      if (renderCount.current > 50) {
        logger.warn(`High render count detected for ${debugName}`, {
          renderCount: renderCount.current,
          recentUpdates: updateHistory.current.slice(-5)
        });
      }
    }
  });

  const optimizedSetState = useCallback((newValueOrUpdater: T | ((prev: T) => T)) => {
    const updateStartTime = performance.now();
    const now = Date.now();
    
    // Throttling check
    if (updateThrottleMs > 0 && now - lastUpdateTime.current < updateThrottleMs) {
      if (enableLogging) {
        logger.debug(`Update throttled for ${debugName}`, { throttleMs: updateThrottleMs });
      }
      return;
    }

    setState(prevState => {
      const newValue = typeof newValueOrUpdater === 'function' 
        ? (newValueOrUpdater as (prev: T) => T)(prevState)
        : newValueOrUpdater;

      // Custom comparison eller shallow equality check
      const hasChanged = customComparator 
        ? !customComparator(prevState, newValue)
        : prevState !== newValue;

      if (!hasChanged) {
        if (enableLogging) {
          logger.debug(`No state change detected for ${debugName}`, { value: newValue });
        }
        return prevState;
      }

      // Update tracking
      updateCount.current++;
      lastUpdateTime.current = now;
      
      const updateInfo: StateUpdateInfo = {
        timestamp: now,
        prevValue: prevState,
        newValue,
        updateSource: new Error().stack?.split('\n')[3] || 'unknown'
      };
      
      updateHistory.current.push(updateInfo);
      
      // Håll bara senaste 100 updates i minnet
      if (updateHistory.current.length > 100) {
        updateHistory.current = updateHistory.current.slice(-50);
      }

      // Performance tracking
      if (enablePerformanceTracking) {
        const updateDuration = performance.now() - updateStartTime;
        perfLogger.trackPerformance(`${debugName}_update_duration`, updateDuration);
        
        if (updateDuration > 5) {
          logger.warn(`Slow state update detected for ${debugName}`, {
            duration: updateDuration,
            updateInfo
          });
        }
      }

      if (enableLogging) {
        logger.debug(`State updated for ${debugName}`, {
          from: prevState,
          to: newValue,
          updateCount: updateCount.current,
          renderCount: renderCount.current
        });
      }

      return newValue;
    });
  }, [customComparator, enableLogging, enablePerformanceTracking, updateThrottleMs, debugName]);

  // Diagnostik-funktion för debugging
  const getStateMetrics = useCallback(() => {
    return {
      currentValue: state,
      renderCount: renderCount.current,
      updateCount: updateCount.current,
      recentUpdates: updateHistory.current.slice(-10),
      avgUpdateFrequency: updateHistory.current.length > 1 
        ? (updateHistory.current[updateHistory.current.length - 1]?.timestamp - updateHistory.current[0]?.timestamp) / updateHistory.current.length
        : 0
    };
  }, [state]);

  return [state, optimizedSetState, getStateMetrics] as const;
}

/**
 * Bulk state optimizer för flera state hooks
 */
export function useBulkStateOptimizer() {
  const stateInstances = useRef<Map<string, any>>(new Map());
  
  const registerState = useCallback((key: string, stateInfo: any) => {
    stateInstances.current.set(key, stateInfo);
  }, []);

  const getGlobalMetrics = useCallback(() => {
    const allMetrics: Record<string, any> = {};
    
    stateInstances.current.forEach((stateInfo, key) => {
      if (stateInfo.getStateMetrics) {
        allMetrics[key] = stateInfo.getStateMetrics();
      }
    });
    
    return {
      totalStates: stateInstances.current.size,
      stateMetrics: allMetrics,
      recommendations: generateOptimizationRecommendations(allMetrics)
    };
  }, []);

  return {
    registerState,
    getGlobalMetrics
  };
}

function generateOptimizationRecommendations(metrics: Record<string, any>): string[] {
  const recommendations: string[] = [];
  
  Object.entries(metrics).forEach(([key, metric]) => {
    if (metric.renderCount > 100) {
      recommendations.push(`Consider memoization for ${key} - high render count (${metric.renderCount})`);
    }
    
    if (metric.avgUpdateFrequency < 100) {
      recommendations.push(`${key} updates very frequently - consider debouncing`);
    }
    
    if (metric.updateCount > metric.renderCount * 2) {
      recommendations.push(`${key} has more updates than renders - possible optimization opportunity`);
    }
  });
  
  return recommendations;
}

/**
 * Memory-optimerad object state hook
 */
export function useOptimizedObjectState<T extends Record<string, any>>(
  initialValue: T,
  options: OptimizedStateOptions<T> = {}
) {
  const [state, setState, getMetrics] = useOptimizedState(initialValue, {
    ...options,
    customComparator: (prev, next) => {
      // Shallow equality check för objects
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      
      if (prevKeys.length !== nextKeys.length) return false;
      
      return prevKeys.every(key => prev[key] === next[key]);
    }
  });

  const updateProperty = useCallback((key: keyof T, value: T[keyof T]) => {
    setState(prev => ({
      ...prev,
      [key]: value
    }));
  }, [setState]);

  const updateMultipleProperties = useCallback((updates: Partial<T>) => {
    setState(prev => ({
      ...prev,
      ...updates
    }));
  }, [setState]);

  return {
    state,
    setState,
    updateProperty,
    updateMultipleProperties,
    getMetrics
  };
}

/**
 * Array state optimizer med virtualisering
 */
export function useOptimizedArrayState<T>(
  initialValue: T[],
  options: OptimizedStateOptions<T[]> & {
    virtualizeThreshold?: number;
    maxItems?: number;
  } = {}
) {
  const { virtualizeThreshold = 1000, maxItems = 10000 } = options;
  
  const [state, setState, getMetrics] = useOptimizedState(initialValue, options);

  const addItem = useCallback((item: T) => {
    setState(prev => {
      const newArray = [...prev, item];
      
      // Automatisk rensning om för många items
      if (newArray.length > maxItems) {
        logger.warn(`Array exceeded max items (${maxItems}), removing oldest items`);
        return newArray.slice(-maxItems * 0.8); // Behåll 80% av max
      }
      
      return newArray;
    });
  }, [setState, maxItems]);

  const removeItem = useCallback((index: number) => {
    setState(prev => prev.filter((_, i) => i !== index));
  }, [setState]);

  const updateItem = useCallback((index: number, item: T) => {
    setState(prev => prev.map((existing, i) => i === index ? item : existing));
  }, [setState]);

  const shouldVirtualize = useMemo(() => {
    return state.length > virtualizeThreshold;
  }, [state.length, virtualizeThreshold]);

  return {
    state,
    setState,
    addItem,
    removeItem,
    updateItem,
    shouldVirtualize,
    getMetrics
  };
}