/**
 * 📊 ADVANCED ANALYTICS & MONITORING SYSTEM
 * SCRUM-TEAM FAS 6 IMPLEMENTATION
 * 
 * Real-time user behavior tracking och system optimization
 * Budget: 1 miljard kronor development standard
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { logger, perfLogger } from '@/utils/productionLogger';

// Advanced metrics collection
interface UserBehaviorMetrics {
  pageViews: number;
  timeOnPage: number;
  clickEvents: number;
  scrollDepth: number;
  errorRate: number;
  performanceScore: number;
  conversionEvents: number;
}

interface SystemPerformanceMetrics {
  responseTime: number;
  memoryUsage: number;
  errorCount: number;
  activeUsers: number;
  cpuUsage: number;
  networkLatency: number;
}

export class AdvancedAnalyticsEngine {
  private static instance: AdvancedAnalyticsEngine;
  private metricsBuffer: Map<string, any[]> = new Map();
  private performanceObserver: PerformanceObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private isTracking = false;

  static getInstance(): AdvancedAnalyticsEngine {
    if (!AdvancedAnalyticsEngine.instance) {
      AdvancedAnalyticsEngine.instance = new AdvancedAnalyticsEngine();
    }
    return AdvancedAnalyticsEngine.instance;
  }

  // Initialize comprehensive tracking
  async initializeTracking(userId: string): Promise<void> {
    if (this.isTracking) return;
    
    this.isTracking = true;
    
    // Performance monitoring
    this.setupPerformanceTracking();
    
    // User interaction tracking
    this.setupInteractionTracking();
    
    // Error tracking
    this.setupErrorTracking();
    
    // Scroll depth tracking
    this.setupScrollTracking();
    
    // Session recording setup
    this.setupSessionRecording(userId);
    
    logger.info('Advanced analytics tracking initialized');
  }

  private setupPerformanceTracking(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackMetric('performance', {
            name: entry.name,
            type: entry.entryType,
            duration: entry.duration,
            startTime: entry.startTime,
            timestamp: Date.now()
          });
        }
      });

      this.performanceObserver.observe({ 
        entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint', 'first-input'] 
      });
    }
  }

  private setupInteractionTracking(): void {
    // Click tracking with heatmap data
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      
      this.trackMetric('user_interaction', {
        type: 'click',
        element: target.tagName.toLowerCase(),
        className: target.className,
        id: target.id,
        text: target.textContent?.slice(0, 100),
        coordinates: {
          x: event.clientX,
          y: event.clientY,
          relativeX: rect.left,
          relativeY: rect.top
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        timestamp: Date.now()
      });
    });

    // Form interaction tracking
    document.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      
      this.trackMetric('form_interaction', {
        type: 'input',
        fieldType: target.type,
        fieldName: target.name,
        fieldId: target.id,
        valueLength: target.value.length,
        timestamp: Date.now()
      });
    });

    // Page visibility tracking
    document.addEventListener('visibilitychange', () => {
      this.trackMetric('page_visibility', {
        state: document.visibilityState,
        timestamp: Date.now()
      });
    });
  }

  private setupErrorTracking(): void {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackMetric('javascript_error', {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now()
      });
    });

    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackMetric('promise_rejection', {
        reason: event.reason?.toString(),
        timestamp: Date.now()
      });
    });

    // React error boundaries integration
    window.addEventListener('react-error', ((event: CustomEvent) => {
      this.trackMetric('react_error', {
        error: event.detail.error?.message,
        errorInfo: event.detail.errorInfo,
        timestamp: Date.now()
      });
    }) as EventListener);
  }

  private setupScrollTracking(): void {
    let maxScrollDepth = 0;
    let scrollTimer: NodeJS.Timeout;

    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      
      scrollTimer = setTimeout(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        const scrollDepth = (scrollTop + windowHeight) / documentHeight;
        
        if (scrollDepth > maxScrollDepth) {
          maxScrollDepth = scrollDepth;
          
          this.trackMetric('scroll_depth', {
            depth: Math.round(scrollDepth * 100),
            scrollTop,
            timestamp: Date.now()
          });
        }
      }, 100);
    });
  }

  private setupSessionRecording(userId: string): void {
    // Simplified session recording (captures key events)
    const sessionId = `session_${Date.now()}_${userId}`;
    
    this.trackMetric('session_start', {
      sessionId,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });

    // Track page changes
    let currentPath = window.location.pathname;
    const checkPathChange = () => {
      if (window.location.pathname !== currentPath) {
        this.trackMetric('page_change', {
          from: currentPath,
          to: window.location.pathname,
          sessionId,
          timestamp: Date.now()
        });
        currentPath = window.location.pathname;
      }
    };

    setInterval(checkPathChange, 1000);
  }

  // Track custom metric
  trackMetric(type: string, data: any): void {
    if (!this.metricsBuffer.has(type)) {
      this.metricsBuffer.set(type, []);
    }
    
    const buffer = this.metricsBuffer.get(type)!;
    buffer.push(data);
    
    // Keep buffer size manageable
    if (buffer.length > 100) {
      buffer.shift();
    }
    
    // Send metrics in batches
    this.batchSendMetrics();
  }

  private batchSendMetrics = (() => {
    let timer: NodeJS.Timeout;
    
    return () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await this.flushMetrics();
      }, 5000); // Send every 5 seconds
    };
  })();

  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.size === 0) return;
    
    try {
      const metricsToSend = Object.fromEntries(this.metricsBuffer);
      
      // Send to Supabase analytics table
      const { error } = await supabase.from('analytics_events').insert({
        event: 'batch_metrics',
        user_id: 'system',
        properties: metricsToSend,
        session_id: `analytics_${Date.now()}`,
        page_url: window.location.href
      });
      
      if (!error) {
        // Clear sent metrics
        this.metricsBuffer.clear();
      }
    } catch (error) {
      logger.error('Failed to flush metrics', error);
    }
  }

  // Get real-time metrics
  getRealTimeMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {};
    
    for (const [type, data] of this.metricsBuffer) {
      metrics[type] = {
        count: data.length,
        latest: data[data.length - 1],
        summary: this.calculateSummary(data)
      };
    }
    
    return metrics;
  }

  private calculateSummary(data: any[]): any {
    if (data.length === 0) return {};
    
    // Basic statistical summary
    if (typeof data[0] === 'number') {
      const values = data as number[];
      return {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      };
    }
    
    return { count: data.length };
  }

  // Cleanup
  destroy(): void {
    this.performanceObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.isTracking = false;
    this.metricsBuffer.clear();
  }
}

/**
 * 🎯 REACT HOOK FOR ADVANCED ANALYTICS
 */
export const useAdvancedAnalytics = () => {
  const { user } = useAuth();
  const analyticsEngine = useRef<AdvancedAnalyticsEngine>();
  const [metrics, setMetrics] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!user) return;
    
    analyticsEngine.current = AdvancedAnalyticsEngine.getInstance();
    analyticsEngine.current.initializeTracking(user.id);
    
    // Update metrics every 10 seconds
    const interval = setInterval(() => {
      if (analyticsEngine.current) {
        setMetrics(analyticsEngine.current.getRealTimeMetrics());
      }
    }, 10000);
    
    return () => {
      clearInterval(interval);
      analyticsEngine.current?.destroy();
    };
  }, [user]);

  const trackCustomEvent = useCallback((eventName: string, properties: any) => {
    analyticsEngine.current?.trackMetric('custom_event', {
      event: eventName,
      properties,
      timestamp: Date.now()
    });
  }, []);

  const trackConversion = useCallback((conversionType: string, value?: number) => {
    analyticsEngine.current?.trackMetric('conversion', {
      type: conversionType,
      value,
      timestamp: Date.now()
    });
  }, []);

  const trackUserJourney = useCallback((step: string, data?: any) => {
    analyticsEngine.current?.trackMetric('user_journey', {
      step,
      data,
      timestamp: Date.now()
    });
  }, []);

  return {
    metrics,
    trackCustomEvent,
    trackConversion,
    trackUserJourney
  };
};

export default {
  AdvancedAnalyticsEngine,
  useAdvancedAnalytics
};
