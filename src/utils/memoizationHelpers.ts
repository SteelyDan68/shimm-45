/**
 * 🧠 MEMOIZATION HELPERS
 * SCRUM-TEAM ADVANCED CACHING AND OPTIMIZATION UTILITIES
 */
import { useMemo, useRef } from 'react';
import { logger } from '@/utils/productionLogger';

/**
 * LRU Cache Implementation for Memoization
 */
class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number = 100) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      const value = this.cache.get(key)!;
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Global memoization cache with TTL support
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

class GlobalMemoCache {
  private cache = new LRUCache<string, CacheEntry<any>>(1000);

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.clear(); // Simple fallback
      return undefined;
    }

    return entry.value;
  }

  set<T>(key: string, value: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size(),
      capacity: 1000
    };
  }
}

export const globalMemoCache = new GlobalMemoCache();

/**
 * Enhanced memoization with cache key generation
 */
export const createMemoizer = <TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  options: {
    maxSize?: number;
    ttl?: number;
    keyGenerator?: (...args: TArgs) => string;
    onCacheHit?: (key: string) => void;
    onCacheMiss?: (key: string) => void;
  } = {}
) => {
  const {
    maxSize = 100,
    ttl = 5 * 60 * 1000,
    keyGenerator = (...args) => JSON.stringify(args),
    onCacheHit,
    onCacheMiss
  } = options;

  const cache = new LRUCache<string, CacheEntry<TReturn>>(maxSize);

  return (...args: TArgs): TReturn => {
    const key = keyGenerator(...args);
    const now = Date.now();

    // Check cache
    const cached = cache.get(key);
    if (cached && (now - cached.timestamp) < cached.ttl) {
      onCacheHit?.(key);
      return cached.value;
    }

    // Cache miss - compute value
    onCacheMiss?.(key);
    const value = fn(...args);

    // Store in cache
    cache.set(key, {
      value,
      timestamp: now,
      ttl
    });

    return value;
  };
};

/**
 * Memoized selector for complex data transformations
 */
export const createSelector = <TInput, TOutput>(
  inputSelectors: Array<(state: any) => any>,
  resultFunc: (...args: any[]) => TOutput,
  options?: {
    equalityCheck?: (a: any, b: any) => boolean;
    maxSize?: number;
  }
) => {
  const {
    equalityCheck = (a, b) => a === b,
    maxSize = 50
  } = options || {};

  const cache = new LRUCache<string, { inputs: any[]; result: TOutput }>(maxSize);

  return (state: TInput): TOutput => {
    // Extract inputs using selectors
    const inputs = inputSelectors.map(selector => selector(state));
    const key = JSON.stringify(inputs);

    // Check cache
    const cached = cache.get(key);
    if (cached) {
      // Verify inputs haven't changed
      const inputsEqual = cached.inputs.every((input, index) => 
        equalityCheck(input, inputs[index])
      );
      
      if (inputsEqual) {
        return cached.result;
      }
    }

    // Compute new result
    const result = resultFunc(...inputs);
    
    // Cache result
    cache.set(key, { inputs, result });
    
    return result;
  };
};

/**
 * React hook for expensive computations with intelligent caching
 */
export const useMemoizedComputation = <T>(
  computation: () => T,
  dependencies: any[],
  options: {
    computationName?: string;
    warnThreshold?: number;
    cacheGlobally?: boolean;
    globalKey?: string;
  } = {}
) => {
  const {
    computationName = 'anonymous',
    warnThreshold = 10, // ms
    cacheGlobally = false,
    globalKey
  } = options;

  const computationRef = useRef<() => T>(computation);
  const prevDepsRef = useRef<any[]>(dependencies);

  // Update computation function reference
  computationRef.current = computation;

  return useMemo(() => {
    const globalCacheKey = globalKey && cacheGlobally 
      ? `${globalKey}_${JSON.stringify(dependencies)}`
      : null;

    // Check global cache first
    if (globalCacheKey) {
      const cached = globalMemoCache.get<T>(globalCacheKey);
      if (cached !== undefined) {
        return cached;
      }
    }

    // Measure computation time
    const startTime = performance.now();
    const result = computationRef.current();
    const computationTime = performance.now() - startTime;

    // Performance monitoring
    if (process.env.NODE_ENV === 'development') {
      if (computationTime > warnThreshold) {
        logger.warn(`Slow computation detected: ${computationName} took ${computationTime.toFixed(2)}ms`, {
          dependencies: dependencies.length,
          computationName
        });
      }

      // Track dependency changes
      if (prevDepsRef.current.length > 0) {
        const changedDeps = dependencies.map((dep, index) => 
          dep !== prevDepsRef.current[index]
        );
        
        if (changedDeps.some(Boolean)) {
          logger.debug(`Computation rerun: ${computationName}`, {
            changedDependencies: changedDeps.length,
            totalDependencies: dependencies.length
          });
        }
      }
      
      prevDepsRef.current = dependencies;
    }

    // Store in global cache if enabled
    if (globalCacheKey) {
      globalMemoCache.set(globalCacheKey, result);
    }

    return result;
  }, dependencies);
};

/**
 * Optimized object comparison for React.memo
 */
export const createOptimizedComparison = <T extends Record<string, any>>(
  options: {
    ignoreKeys?: string[];
    deepCompare?: string[];
    customComparers?: Record<string, (a: any, b: any) => boolean>;
  } = {}
) => {
  const { ignoreKeys = [], deepCompare = [], customComparers = {} } = options;

  return (prevProps: T, nextProps: T): boolean => {
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);

    // Quick check for key count
    if (prevKeys.length !== nextKeys.length) return false;

    // Check each property
    for (const key of prevKeys) {
      if (ignoreKeys.includes(key)) continue;

      const prevValue = prevProps[key];
      const nextValue = nextProps[key];

      // Use custom comparer if available
      if (customComparers[key]) {
        if (!customComparers[key](prevValue, nextValue)) return false;
        continue;
      }

      // Deep comparison for specified keys
      if (deepCompare.includes(key)) {
        if (JSON.stringify(prevValue) !== JSON.stringify(nextValue)) {
          return false;
        }
        continue;
      }

      // Shallow comparison
      if (prevValue !== nextValue) return false;
    }

    return true;
  };
};

/**
 * Performance-optimized array operations
 */
export const optimizedArrayOperations = {
  // Memoized array filtering
  filter: createMemoizer(
    <T>(array: T[], predicate: (item: T) => boolean) => array.filter(predicate),
    { keyGenerator: (array, predicate) => `filter_${array.length}_${predicate.toString()}` }
  ),

  // Memoized array mapping
  map: createMemoizer(
    <T, U>(array: T[], mapper: (item: T) => U) => array.map(mapper),
    { keyGenerator: (array, mapper) => `map_${array.length}_${mapper.toString()}` }
  ),

  // Memoized array sorting
  sort: createMemoizer(
    <T>(array: T[], compareFn?: (a: T, b: T) => number) => [...array].sort(compareFn),
    { keyGenerator: (array, compareFn) => `sort_${array.length}_${compareFn?.toString() || 'default'}` }
  ),

  // Memoized array grouping
  groupBy: createMemoizer(
    <T, K extends string | number>(array: T[], keyExtractor: (item: T) => K) => {
      return array.reduce((groups, item) => {
        const key = keyExtractor(item);
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
        return groups;
      }, {} as Record<K, T[]>);
    },
    { keyGenerator: (array, keyExtractor) => `groupBy_${array.length}_${keyExtractor.toString()}` }
  )
};

/**
 * Clear all memoization caches
 */
export const clearAllCaches = () => {
  globalMemoCache.clear();
  logger.info('All memoization caches cleared');
};

/**
 * Get cache statistics for monitoring
 */
export const getCacheStats = () => {
  return {
    global: globalMemoCache.getStats(),
    timestamp: Date.now()
  };
};