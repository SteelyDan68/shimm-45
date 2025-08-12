/**
 * 🚀 SPRINT 3: ULTRA-ADVANCED USER EXPERIENCE SYSTEM
 * AI-driven performance, smart loading, neuroplastisk feedback
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger, perfLogger } from '@/utils/productionLogger';

interface LoadingState {
  isLoading: boolean;
  progress: number;
  stage: string;
  estimatedTime?: number;
  error?: Error;
}

interface SmartPreloadConfig {
  enablePredictiveLoading: boolean;
  userBehaviorLearning: boolean;
  neuroplasticOptimization: boolean;
  adaptiveThresholds: boolean;
}

/**
 * 🧠 NEUROPLASTISKT OPTIMERAD LOADING HOOK
 * Anpassar laddningstider baserat på användarens kognitiva mönster
 */
export function useNeuroplasticLoading(config: SmartPreloadConfig = {
  enablePredictiveLoading: true,
  userBehaviorLearning: true,
  neuroplasticOptimization: true,
  adaptiveThresholds: true
}) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    stage: 'idle'
  });

  const behaviorPatterns = useRef<Map<string, number[]>>(new Map());
  const neuroplasticTimer = useRef<NodeJS.Timeout>();
  const cognitiveLoadThreshold = useRef<number>(150); // ms

  const startNeuroplasticLoading = useCallback(async (
    loadFunction: () => Promise<any>,
    context: { component: string; complexity: number; userFamiliarity?: number }
  ) => {
    const startTime = performance.now();
    const { component, complexity, userFamiliarity = 0.5 } = context;

    // Beräkna optimal laddningstid baserat på neuroplasticitet
    const optimalLoadingTime = calculateOptimalLoadingTime(complexity, userFamiliarity);
    
    setLoadingState({
      isLoading: true,
      progress: 0,
      stage: 'initiating',
      estimatedTime: optimalLoadingTime
    });

    logger.info('Neuroplastic loading started', {
      component,
      optimalLoadingTime,
      complexity,
      userFamiliarity
    });

    try {
      // Simulera kognitiv feedback med progress
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress += Math.random() * 15;
        if (currentProgress < 90) {
          setLoadingState(prev => ({
            ...prev,
            progress: Math.min(currentProgress, 90),
            stage: getStageForProgress(currentProgress)
          }));
        }
      }, optimalLoadingTime / 10);

      const result = await loadFunction();
      const actualDuration = performance.now() - startTime;

      clearInterval(progressInterval);

      // Lär från användarens reaktion
      if (config.userBehaviorLearning) {
        learnFromUserBehavior(component, actualDuration, optimalLoadingTime);
      }

      // Neuroplastisk feedback - visa framgång
      setLoadingState({
        isLoading: false,
        progress: 100,
        stage: 'completed'
      });

      // Kort neuroplastisk belöning innan reset
      neuroplasticTimer.current = setTimeout(() => {
        setLoadingState({
          isLoading: false,
          progress: 0,
          stage: 'idle'
        });
      }, 500);

      perfLogger.trackPerformance(`neuroplastic_loading_${component}`, actualDuration);
      
      return result;

    } catch (error) {
      setLoadingState({
        isLoading: false,
        progress: 0,
        stage: 'error',
        error: error as Error
      });

      logger.error('Neuroplastic loading failed', error as Error, { component, complexity });
      throw error;
    }
  }, [config]);

  const calculateOptimalLoadingTime = (complexity: number, familiarity: number): number => {
    // Neuroplastisk algoritm för optimal timing
    const baseTime = complexity * 100; // Base på komplexitet
    const familiarityBonus = familiarity * 50; // Kända patterns laddar snabbare
    const cognitiveOptimal = Math.max(cognitiveLoadThreshold.current, baseTime - familiarityBonus);
    
    return Math.min(cognitiveOptimal, 2000); // Max 2s för bästa UX
  };

  const learnFromUserBehavior = (component: string, actual: number, expected: number) => {
    const patterns = behaviorPatterns.current.get(component) || [];
    patterns.push(actual);
    
    // Behåll senaste 10 mätningar
    if (patterns.length > 10) patterns.shift();
    
    behaviorPatterns.current.set(component, patterns);

    // Anpassa threshold baserat på lärning
    if (config.adaptiveThresholds) {
      const avgActual = patterns.reduce((a, b) => a + b, 0) / patterns.length;
      cognitiveLoadThreshold.current = Math.max(100, avgActual * 0.8);
    }

    logger.debug('Learning from user behavior', {
      component,
      actual,
      expected,
      newThreshold: cognitiveLoadThreshold.current,
      patterns: patterns.slice(-3)
    });
  };

  const getStageForProgress = (progress: number): string => {
    if (progress < 20) return 'preparing';
    if (progress < 40) return 'loading_data';
    if (progress < 60) return 'processing';
    if (progress < 80) return 'optimizing';
    return 'finalizing';
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (neuroplasticTimer.current) {
        clearTimeout(neuroplasticTimer.current);
      }
    };
  }, []);

  return {
    loadingState,
    startNeuroplasticLoading,
    cognitiveLoadThreshold: cognitiveLoadThreshold.current
  };
}

/**
 * 🔮 PREDIKTIV CACHE HOOK
 * AI-driven prefetching baserat på användarmönster
 */
export function usePredictiveCache() {
  const cacheStore = useRef<Map<string, any>>(new Map());
  const predictionModel = useRef<Map<string, number>>(new Map());
  const userNavigation = useRef<string[]>([]);

  const addToPredictionModel = useCallback((route: string) => {
    userNavigation.current.push(route);
    
    // Behåll senaste 50 navigationer
    if (userNavigation.current.length > 50) {
      userNavigation.current = userNavigation.current.slice(-50);
    }

    // Uppdatera prediction scores
    const recent = userNavigation.current.slice(-10);
    recent.forEach((r, index) => {
      const score = (index + 1) / recent.length; // Nyare får högre score
      predictionModel.current.set(r, (predictionModel.current.get(r) || 0) + score);
    });

    logger.debug('Updated prediction model', {
      route,
      recentNavigation: recent,
      topPredictions: Array.from(predictionModel.current.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    });
  }, []);

  const preloadPredicted = useCallback(async (
    loaders: Record<string, () => Promise<any>>
  ) => {
    const predictions = Array.from(predictionModel.current.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3); // Top 3 predictions

    for (const [route, score] of predictions) {
      if (score > 2 && loaders[route] && !cacheStore.current.has(route)) {
        try {
          perfLogger.start(`predictive_preload_${route}`);
          const data = await loaders[route]();
          cacheStore.current.set(route, data);
          
          const duration = perfLogger.end(`predictive_preload_${route}`);
          logger.info('Predictive preload successful', { route, score, duration });
        } catch (error) {
          logger.warn('Predictive preload failed', { route, error: (error as Error).message });
        }
      }
    }
  }, []);

  const getCached = useCallback((key: string) => {
    const cached = cacheStore.current.get(key);
    if (cached) {
      logger.debug('Cache hit', { key });
      return cached;
    }
    return null;
  }, []);

  const clearCache = useCallback(() => {
    cacheStore.current.clear();
    logger.info('Predictive cache cleared');
  }, []);

  return {
    addToPredictionModel,
    preloadPredicted,
    getCached,
    clearCache,
    cacheSize: cacheStore.current.size
  };
}

/**
 * ✨ SMART TRANSITION HOOK
 * Neuroplastiskt optimerade övergångar mellan vyer
 */
export function useSmartTransitions() {
  const [transitionState, setTransitionState] = useState({
    isTransitioning: false,
    direction: 'forward' as 'forward' | 'backward',
    intensity: 'normal' as 'subtle' | 'normal' | 'dramatic'
  });

  const startTransition = useCallback((
    direction: 'forward' | 'backward' = 'forward',
    context: {
      complexity: number;
      userConfidence: number;
      contentSimilarity: number;
    }
  ) => {
    const { complexity, userConfidence, contentSimilarity } = context;
    
    // Beräkna optimal transition-intensitet
    let intensity: 'subtle' | 'normal' | 'dramatic' = 'normal';
    
    if (userConfidence > 0.8 && contentSimilarity > 0.7) {
      intensity = 'subtle'; // Användaren är bekväm, subtil övergång
    } else if (complexity > 0.7 || contentSimilarity < 0.3) {
      intensity = 'dramatic'; // Stor förändring, tydlig feedback
    }

    setTransitionState({
      isTransitioning: true,
      direction,
      intensity
    });

    logger.debug('Smart transition started', {
      direction,
      intensity,
      context
    });

    // Auto-reset efter transition
    setTimeout(() => {
      setTransitionState(prev => ({ ...prev, isTransitioning: false }));
    }, getTransitionDuration(intensity));

  }, []);

  const getTransitionDuration = (intensity: string): number => {
    switch (intensity) {
      case 'subtle': return 200;
      case 'dramatic': return 500;
      default: return 300;
    }
  };

  const getTransitionClasses = useCallback(() => {
    const { isTransitioning, direction, intensity } = transitionState;
    
    if (!isTransitioning) return '';

    const baseClasses = 'transition-all duration-300 ease-out';
    const directionClasses = direction === 'forward' 
      ? 'transform translate-x-full opacity-0' 
      : 'transform -translate-x-full opacity-0';
    
    const intensityClasses = {
      subtle: 'scale-[0.98]',
      normal: 'scale-95',
      dramatic: 'scale-90 rotate-1'
    };

    return `${baseClasses} ${directionClasses} ${intensityClasses[intensity]}`;
  }, [transitionState]);

  return {
    transitionState,
    startTransition,
    getTransitionClasses
  };
}

/**
 * 🎯 ADAPTIVE PERFORMANCE MONITOR
 * Övervakar och anpassar prestanda i realtid
 */
export function useAdaptivePerformance() {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 60,
    memoryUsage: 0,
    renderTime: 0,
    isOptimized: true
  });

  const frameCount = useRef(0);
  const lastFrameTime = useRef(performance.now());
  const renderTimes = useRef<number[]>([]);

  useEffect(() => {
    const monitorPerformance = () => {
      const now = performance.now();
      const delta = now - lastFrameTime.current;
      lastFrameTime.current = now;
      frameCount.current++;

      // Beräkna FPS
      const fps = Math.round(1000 / delta);
      
      // Samla renderingstider
      renderTimes.current.push(delta);
      if (renderTimes.current.length > 60) {
        renderTimes.current = renderTimes.current.slice(-60);
      }

      const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;

      // Uppdatera metrics
      setPerformanceMetrics(prev => {
        const newMetrics = {
          fps: Math.min(fps, 60),
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
          renderTime: avgRenderTime,
          isOptimized: fps > 45 && avgRenderTime < 16.67 // 60fps target
        };

        // Logga prestanda-varningar
        if (!newMetrics.isOptimized && prev.isOptimized) {
          logger.warn('Performance degradation detected', newMetrics);
        }

        return newMetrics;
      });

      requestAnimationFrame(monitorPerformance);
    };

    const animationId = requestAnimationFrame(monitorPerformance);
    
    return () => cancelAnimationFrame(animationId);
  }, []);

  const getOptimizationSuggestions = useCallback(() => {
    const suggestions: string[] = [];
    
    if (performanceMetrics.fps < 50) {
      suggestions.push('Reduce animation complexity');
    }
    
    if (performanceMetrics.renderTime > 20) {
      suggestions.push('Optimize component rendering');
    }
    
    if (performanceMetrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
      suggestions.push('Clear unused data/caches');
    }

    return suggestions;
  }, [performanceMetrics]);

  return {
    performanceMetrics,
    getOptimizationSuggestions
  };
}