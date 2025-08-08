/**
 * 🚀 STABLE DATA FETCHING HOOK
 * 
 * Prevents unnecessary re-fetching and provides stable loading states
 * Implements intelligent caching and error recovery
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/utils/logger';

interface UseStableDataOptions<T> {
  cacheKey: string;
  fetchFn: () => Promise<T>;
  dependencies?: any[];
  refreshInterval?: number;
  retryAttempts?: number;
  enabled?: boolean;
}

interface UseStableDataReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

// Simple in-memory cache
const dataCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export function useStableData<T>({
  cacheKey,
  fetchFn,
  dependencies = [],
  refreshInterval,
  retryAttempts = 3,
  enabled = true
}: UseStableDataOptions<T>): UseStableDataReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check cache first
  const getCachedData = useCallback(() => {
    const cached = dataCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    return null;
  }, [cacheKey]);

  // Set cache
  const setCachedData = useCallback((newData: T, ttl: number = 5 * 60 * 1000) => {
    dataCache.set(cacheKey, {
      data: newData,
      timestamp: Date.now(),
      ttl
    });
  }, [cacheKey]);

  // Fetch with retry logic
  const fetchWithRetry = useCallback(async (attempt: number = 1): Promise<T> => {
    try {
      const result = await fetchFn();
      return result;
    } catch (err) {
      if (attempt < retryAttempts) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        logger.warn(`Fetch failed, retrying in ${delay}ms (attempt ${attempt}/${retryAttempts})`);
        
        await new Promise(resolve => {
          retryTimeoutRef.current = setTimeout(resolve, delay);
        });
        
        return fetchWithRetry(attempt + 1);
      }
      throw err;
    }
  }, [fetchFn, retryAttempts]);

  // Main fetch function
  const fetchData = useCallback(async (force: boolean = false) => {
    if (!enabled) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check cache first (unless forced)
    if (!force) {
      const cached = getCachedData();
      if (cached) {
        setData(cached);
        setLastUpdated(new Date());
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    
    abortControllerRef.current = new AbortController();

    try {
      const result = await fetchWithRetry();
      
      setData(result);
      setCachedData(result);
      setLastUpdated(new Date());
      setError(null);
      
      logger.debug(`Data fetched successfully for ${cacheKey}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      logger.error(`Failed to fetch data for ${cacheKey}:`, err);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [enabled, cacheKey, getCachedData, setCachedData, fetchWithRetry]);

  // Manual refresh
  const refresh = useCallback(() => fetchData(true), [fetchData]);

  // Initial fetch and dependency-based refetch
  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  // Auto-refresh interval
  useEffect(() => {
    if (!refreshInterval || !enabled) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchData, refreshInterval, enabled]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    refresh,
    lastUpdated
  };
}