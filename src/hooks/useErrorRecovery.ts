/**
 * 🔄 ERROR RECOVERY HOOKS
 * SCRUM-TEAM GRACEFUL DEGRADATION STRATEGIES
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '@/utils/productionLogger';

interface ErrorRecoveryState {
  error: Error | null;
  isRetrying: boolean;
  retryCount: number;
  canRetry: boolean;
}

interface UseErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
  onRetry?: (attempt: number) => void;
  onMaxRetriesExceeded?: () => void;
}

export const useErrorRecovery = (options: UseErrorRecoveryOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onRetry,
    onMaxRetriesExceeded
  } = options;

  const [state, setState] = useState<ErrorRecoveryState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    canRetry: true
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  const setError = useCallback((error: Error) => {
    setState(prev => ({
      ...prev,
      error,
      canRetry: prev.retryCount < maxRetries
    }));

    logger.error('Error Recovery - Error Set', error, {
      retryCount: state.retryCount,
      canRetry: state.retryCount < maxRetries
    });

    onError?.(error);
  }, [maxRetries, onError, state.retryCount]);

  const retry = useCallback(() => {
    if (state.retryCount >= maxRetries) {
      logger.warn('Error Recovery - Max retries exceeded');
      onMaxRetriesExceeded?.();
      return;
    }

    setState(prev => ({
      ...prev,
      isRetrying: true
    }));

    onRetry?.(state.retryCount + 1);

    retryTimeoutRef.current = setTimeout(() => {
      setState(prev => ({
        error: null,
        isRetrying: false,
        retryCount: prev.retryCount + 1,
        canRetry: prev.retryCount + 1 < maxRetries
      }));

      logger.info('Error Recovery - Retry attempted', {
        attempt: state.retryCount + 1,
        maxRetries
      });
    }, retryDelay);
  }, [state.retryCount, maxRetries, retryDelay, onRetry, onMaxRetriesExceeded]);

  const reset = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    setState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      canRetry: true
    });

    logger.info('Error Recovery - State reset');
  }, []);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    setError,
    retry,
    reset
  };
};

// Hook for async operations with automatic retry
export const useAsyncWithRetry = <T, Args extends any[]>(
  asyncFn: (...args: Args) => Promise<T>,
  options: UseErrorRecoveryOptions = {}
) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const errorRecovery = useErrorRecovery(options);

  const execute = useCallback(async (...args: Args) => {
    setLoading(true);
    errorRecovery.reset();

    try {
      const result = await asyncFn(...args);
      setData(result);
      logger.info('Async operation succeeded', { args });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      errorRecovery.setError(err);
      logger.error('Async operation failed', err, { args });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFn, errorRecovery]);

  const retryExecution = useCallback(async (...args: Args) => {
    if (!errorRecovery.canRetry) return;
    
    errorRecovery.retry();
    
    // Wait for retry delay then execute
    setTimeout(() => {
      execute(...args);
    }, options.retryDelay || 1000);
  }, [execute, errorRecovery, options.retryDelay]);

  return {
    execute,
    retry: retryExecution,
    loading,
    data,
    ...errorRecovery
  };
};

// Hook for graceful fallbacks
export const useFallback = <T>(
  primary: () => T,
  fallback: () => T,
  condition?: (error: Error) => boolean
) => {
  const [usingFallback, setUsingFallback] = useState(false);
  const [result, setResult] = useState<T | null>(null);

  useEffect(() => {
    try {
      const primaryResult = primary();
      setResult(primaryResult);
      setUsingFallback(false);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      if (!condition || condition(err)) {
        logger.warn('Using fallback due to error', { error: err.message });
        const fallbackResult = fallback();
        setResult(fallbackResult);
        setUsingFallback(true);
      } else {
        throw err;
      }
    }
  }, [primary, fallback, condition]);

  return {
    result,
    usingFallback
  };
};