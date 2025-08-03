import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface PerformanceContextType {
  trackMetric: (name: string, value: number, metadata?: any) => void;
  getMetrics: () => PerformanceMetric[];
  clearMetrics: () => void;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
}

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: any;
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

/**
 * 📊 PERFORMANCE MONITORING PROVIDER
 * - Real-time performance tracking
 * - Memory usage monitoring
 * - Bundle size optimization
 * - Core Web Vitals tracking
 */
export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(!import.meta.env.DEV);

  const trackMetric = useCallback((name: string, value: number, metadata?: any) => {
    if (!isMonitoring) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    setMetrics(prev => {
      const newMetrics = [...prev, metric];
      // Keep only last 100 metrics to prevent memory leaks
      return newMetrics.slice(-100);
    });

    // Send to analytics in production
    if (!import.meta.env.DEV) {
      try {
        if ('gtag' in window) {
          (window as any).gtag('event', 'performance_metric', {
            metric_name: name,
            metric_value: value,
            ...metadata
          });
        }
      } catch (error) {
        // Silently fail in production
      }
    }
  }, [isMonitoring]);

  const getMetrics = useCallback(() => metrics, [metrics]);
  
  const clearMetrics = useCallback(() => setMetrics([]), []);
  
  const startMonitoring = useCallback(() => setIsMonitoring(true), []);
  
  const stopMonitoring = useCallback(() => setIsMonitoring(false), []);

  // Core Web Vitals monitoring
  useEffect(() => {
    if (!isMonitoring || import.meta.env.DEV) return;

    // Largest Contentful Paint (LCP)
    const observeLCP = () => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          trackMetric('lcp', lastEntry.startTime, { type: 'web_vital' });
        });
        
        try {
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          // LCP not supported
        }
      }
    };

    // First Input Delay (FID)
    const observeFID = () => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            trackMetric('fid', (entry as any).processingStart - entry.startTime, { type: 'web_vital' });
          });
        });
        
        try {
          observer.observe({ entryTypes: ['first-input'] });
        } catch (e) {
          // FID not supported
        }
      }
    };

    // Cumulative Layout Shift (CLS)
    const observeCLS = () => {
      if ('PerformanceObserver' in window) {
        let cumulativeScore = 0;
        
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (!(entry as any).hadRecentInput) {
              cumulativeScore += (entry as any).value;
            }
          });
          trackMetric('cls', cumulativeScore, { type: 'web_vital' });
        });
        
        try {
          observer.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          // CLS not supported
        }
      }
    };

    // Time to First Byte (TTFB)
    const observeTTFB = () => {
      if ('navigation' in performance) {
        const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navTiming) {
          const ttfb = navTiming.responseStart - navTiming.fetchStart;
          trackMetric('ttfb', ttfb, { type: 'web_vital' });
        }
      }
    };

    // Resource loading performance
    const observeResourceTiming = () => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const resource = entry as PerformanceResourceTiming;
            if (resource.duration > 1000) { // Track slow resources
              trackMetric('slow_resource', resource.duration, {
                type: 'resource',
                name: resource.name,
                size: resource.transferSize
              });
            }
          });
        });
        
        try {
          observer.observe({ entryTypes: ['resource'] });
        } catch (e) {
          // Resource timing not supported
        }
      }
    };

    // Memory usage monitoring
    const monitorMemory = () => {
      if ('memory' in performance) {
        const checkMemory = () => {
          const memory = (performance as any).memory;
          trackMetric('memory_used', memory.usedJSHeapSize / 1024 / 1024, {
            type: 'memory',
            total: memory.totalJSHeapSize / 1024 / 1024,
            limit: memory.jsHeapSizeLimit / 1024 / 1024
          });
        };

        checkMemory();
        const interval = setInterval(checkMemory, 30000); // Every 30 seconds
        
        return () => clearInterval(interval);
      }
    };

    observeLCP();
    observeFID();
    observeCLS();
    observeTTFB();
    observeResourceTiming();
    const cleanupMemory = monitorMemory();

    return () => {
      cleanupMemory?.();
    };
  }, [isMonitoring, trackMetric]);

  // Bundle size tracking
  useEffect(() => {
    if (!isMonitoring || import.meta.env.DEV) return;

    const trackBundleSize = async () => {
      try {
        const response = await fetch(window.location.href);
        const html = await response.text();
        const scriptTags = html.match(/<script[^>]+src=\"[^\"]+\"/g) || [];
        const cssTags = html.match(/<link[^>]+href=\"[^\"]+\\.css\"/g) || [];
        
        trackMetric('bundle_scripts', scriptTags.length, { type: 'bundle' });
        trackMetric('bundle_styles', cssTags.length, { type: 'bundle' });
      } catch (error) {
        // Silently fail
      }
    };

    trackBundleSize();
  }, [isMonitoring, trackMetric]);

  const value = {
    trackMetric,
    getMetrics,
    clearMetrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
};

export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within PerformanceProvider');
  }
  return context;
};

// High-order component for performance tracking
export const withPerformanceTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  const WrappedComponent = (props: P) => {
    const { trackMetric } = usePerformance();
    const startTime = React.useRef<number>();

    React.useEffect(() => {
      startTime.current = performance.now();
      
      return () => {
        if (startTime.current) {
          const renderTime = performance.now() - startTime.current;
          trackMetric(`component_render_${componentName}`, renderTime, {
            type: 'component_performance'
          });
        }
      };
    }, [trackMetric]);

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withPerformanceTracking(${componentName})`;
  return WrappedComponent;
};

// Hook for component-level performance tracking
export const useComponentPerformance = (componentName: string) => {
  const { trackMetric } = usePerformance();
  
  const trackRender = React.useCallback(() => {
    const startTime = performance.now();
    
    return () => {
      const renderTime = performance.now() - startTime;
      trackMetric(`render_${componentName}`, renderTime, {
        type: 'render_performance'
      });
    };
  }, [trackMetric, componentName]);
  
  const trackInteraction = React.useCallback((interactionName: string) => {
    const startTime = performance.now();
    
    return () => {
      const interactionTime = performance.now() - startTime;
      trackMetric(`interaction_${componentName}_${interactionName}`, interactionTime, {
        type: 'interaction_performance'
      });
    };
  }, [trackMetric, componentName]);
  
  return { trackRender, trackInteraction };
};
