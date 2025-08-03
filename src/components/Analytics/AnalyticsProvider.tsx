import React, { createContext, useContext, useEffect } from 'react';
import { useAnalyticsTracking } from '@/hooks/useAnalyticsTracking';
import { useLocation } from 'react-router-dom';

interface AnalyticsContextType {
  analytics: ReturnType<typeof useAnalyticsTracking>;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

/**
 * 📊 ANALYTICS PROVIDER COMPONENT
 * - Automatic page tracking
 * - Global error handling
 * - Performance monitoring
 * - Session management
 */
export const AnalyticsProvider = ({ children }: AnalyticsProviderProps) => {
  const analytics = useAnalyticsTracking();
  const location = useLocation();

  // Track page changes
  useEffect(() => {
    const pageName = location.pathname.slice(1) || 'home';
    analytics.trackPageView(pageName, {
      search: location.search,
      hash: location.hash
    });
  }, [location, analytics]);

  // Track performance metrics
  useEffect(() => {
    // Track initial page load performance
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navTiming) {
        analytics.trackPerformance('page_load_time', navTiming.loadEventEnd - navTiming.fetchStart);
        analytics.trackPerformance('dom_content_loaded', navTiming.domContentLoadedEventEnd - navTiming.fetchStart);
        analytics.trackPerformance('first_paint', navTiming.responseEnd - navTiming.fetchStart);
      }
    }

    // Track Web Vitals if available
    if ('web-vitals' in window) {
      // This would be implemented with web-vitals library in a real app
      console.log('Web Vitals tracking could be implemented here');
    }
  }, [analytics]);

  // Track user engagement
  useEffect(() => {
    let startTime = Date.now();
    let isVisible = !document.hidden;

    const handleVisibilityChange = () => {
      const now = Date.now();
      const timeSpent = now - startTime;

      if (document.hidden && isVisible) {
        // Page became hidden
        analytics.trackPerformance('time_on_page_visible', timeSpent);
        isVisible = false;
      } else if (!document.hidden && !isVisible) {
        // Page became visible
        startTime = now;
        isVisible = true;
        analytics.trackUserAction('page_focus', 'window');
      }
    };

    const handleBeforeUnload = () => {
      const timeSpent = Date.now() - startTime;
      analytics.trackPerformance('session_duration', timeSpent);
      analytics.flushAnalyticsBuffer(); // Ensure data is sent
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [analytics]);

  return (
    <AnalyticsContext.Provider value={{ analytics }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context.analytics;
};