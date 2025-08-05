/**
 * 🎯 LOADING STATE MANAGEMENT HOOKS
 * SCRUM-TEAM INTELLIGENT LOADING STATE COORDINATION
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/utils/productionLogger';

export interface LoadingState {
  isLoading: boolean;
  progress?: number;
  stage?: string;
  error?: Error;
  startTime?: number;
  estimatedDuration?: number;
}

export interface UseLoadingOptions {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  onTimeout?: () => void;
}

/**
 * Enhanced Loading State Hook with Progress Tracking
 */
export const useLoadingState = (options: UseLoadingOptions = {}) => {
  const {
    timeout = 30000, // 30 seconds default
    retryAttempts = 3,
    retryDelay = 1000,
    onStart,
    onComplete,
    onError,
    onTimeout
  } = options;

  const [state, setState] = useState<LoadingState>({
    isLoading: false
  });
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);

  const startLoading = useCallback((stage?: string, estimatedDuration?: number) => {
    const startTime = Date.now();
    
    setState({
      isLoading: true,
      progress: 0,
      stage,
      error: undefined,
      startTime,
      estimatedDuration
    });

    // Set timeout
    if (timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, error: new Error('Loading timeout') }));
        onTimeout?.();
        logger.warn('Loading timeout exceeded', { stage, timeout });
      }, timeout);
    }

    onStart?.();
    logger.info('Loading started', { stage, estimatedDuration });
  }, [timeout, onStart, onTimeout]);

  const updateProgress = useCallback((progress: number, stage?: string) => {
    setState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
      stage: stage || prev.stage
    }));
  }, []);

  const setStage = useCallback((stage: string) => {
    setState(prev => ({ ...prev, stage }));
    logger.debug('Loading stage updated', { stage });
  }, []);

  const completeLoading = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setState(prev => {
      const duration = prev.startTime ? Date.now() - prev.startTime : 0;
      logger.info('Loading completed', { 
        stage: prev.stage, 
        duration,
        estimatedDuration: prev.estimatedDuration
      });

      return {
        isLoading: false,
        progress: 100,
        stage: prev.stage,
        error: undefined
      };
    });

    retryCountRef.current = 0;
    onComplete?.();
  }, [onComplete]);

  const setError = useCallback((error: Error) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setState(prev => ({
      ...prev,
      isLoading: false,
      error
    }));

    logger.error('Loading failed', { error: error.message, stage: state.stage });
    onError?.(error);
  }, [onError, state.stage]);

  const retry = useCallback(() => {
    if (retryCountRef.current < retryAttempts) {
      retryCountRef.current++;
      
      setTimeout(() => {
        startLoading(state.stage, state.estimatedDuration);
      }, retryDelay);

      logger.info('Retrying loading', { 
        attempt: retryCountRef.current, 
        maxAttempts: retryAttempts 
      });
    } else {
      logger.error('Max retry attempts exceeded');
    }
  }, [retryAttempts, retryDelay, startLoading, state.stage, state.estimatedDuration]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setState({
      isLoading: false,
      progress: 0,
      stage: undefined,
      error: undefined
    });
    
    retryCountRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startLoading,
    updateProgress,
    setStage,
    completeLoading,
    setError,
    retry,
    reset,
    canRetry: retryCountRef.current < retryAttempts
  };
};

/**
 * Multi-Stage Loading Hook for Complex Operations
 */
export interface LoadingStage {
  name: string;
  weight: number; // Percentage of total progress this stage represents
  duration?: number; // Estimated duration in ms
}

export const useMultiStageLoading = (stages: LoadingStage[]) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const totalWeight = stages.reduce((sum, stage) => sum + stage.weight, 0);

  const calculateOverallProgress = useCallback(() => {
    if (!isLoading || stages.length === 0) return 0;

    const completedStagesWeight = stages
      .slice(0, currentStageIndex)
      .reduce((sum, stage) => sum + stage.weight, 0);

    const currentStageWeight = stages[currentStageIndex]?.weight || 0;
    const currentStageProgress = (stageProgress / 100) * currentStageWeight;

    return ((completedStagesWeight + currentStageProgress) / totalWeight) * 100;
  }, [stages, currentStageIndex, stageProgress, isLoading, totalWeight]);

  const startStage = useCallback((stageIndex: number) => {
    if (stageIndex >= 0 && stageIndex < stages.length) {
      setCurrentStageIndex(stageIndex);
      setStageProgress(0);
      setIsLoading(true);
      setError(null);

      logger.info('Multi-stage loading started', { 
        stage: stages[stageIndex].name,
        stageIndex,
        totalStages: stages.length
      });
    }
  }, [stages]);

  const updateStageProgress = useCallback((progress: number) => {
    setStageProgress(Math.min(100, Math.max(0, progress)));
  }, []);

  const nextStage = useCallback(() => {
    if (currentStageIndex < stages.length - 1) {
      setCurrentStageIndex(prev => prev + 1);
      setStageProgress(0);

      logger.info('Moving to next stage', { 
        stage: stages[currentStageIndex + 1]?.name,
        stageIndex: currentStageIndex + 1
      });
    } else {
      // All stages complete
      setIsLoading(false);
      setStageProgress(100);
      
      logger.info('All stages completed');
    }
  }, [currentStageIndex, stages]);

  const setStageError = useCallback((error: Error) => {
    setError(error);
    setIsLoading(false);

    logger.error('Multi-stage loading failed', {
      error: error.message,
      stage: stages[currentStageIndex]?.name,
      stageIndex: currentStageIndex
    });
  }, [stages, currentStageIndex]);

  const reset = useCallback(() => {
    setCurrentStageIndex(0);
    setStageProgress(0);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    currentStageIndex,
    currentStage: stages[currentStageIndex],
    stageProgress,
    overallProgress: calculateOverallProgress(),
    stages: stages.map((stage, index) => ({
      ...stage,
      completed: index < currentStageIndex,
      active: index === currentStageIndex,
      pending: index > currentStageIndex
    })),
    startStage,
    updateStageProgress,
    nextStage,
    setError: setStageError,
    reset
  };
};

/**
 * Network-Aware Loading Hook
 */
export const useNetworkAwareLoading = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState(Date.now());

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsReconnecting(false);
      setLastOnlineTime(Date.now());
      logger.info('Network connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('Network connection lost');
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !navigator.onLine) {
        setIsReconnecting(true);
        logger.info('Page visible but offline, attempting reconnection');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const getLoadingStrategy = useCallback(() => {
    if (!isOnline) {
      return {
        timeout: 5000, // Shorter timeout when offline
        retryAttempts: 1,
        retryDelay: 5000,
        showOfflineMessage: true
      };
    }

    // Adjust based on how long we've been online
    const timeSinceOnline = Date.now() - lastOnlineTime;
    const isRecentlyOnline = timeSinceOnline < 10000; // Less than 10 seconds

    return {
      timeout: isRecentlyOnline ? 10000 : 30000,
      retryAttempts: isRecentlyOnline ? 2 : 3,
      retryDelay: isRecentlyOnline ? 2000 : 1000,
      showOfflineMessage: false
    };
  }, [isOnline, lastOnlineTime]);

  return {
    isOnline,
    isReconnecting,
    lastOnlineTime,
    loadingStrategy: getLoadingStrategy()
  };
};