import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';

// Analytics event types
export type AnalyticsEvent = 
  | 'page_view'
  | 'user_action' 
  | 'ai_interaction'
  | 'assessment_completed'
  | 'task_created'
  | 'task_completed'
  | 'journey_step_completed'
  | 'error_occurred'
  | 'performance_metric';

export interface AnalyticsEventData {
  event: AnalyticsEvent;
  properties: Record<string, any>;
  timestamp?: string;
  session_id?: string;
  user_agent?: string;
  page_url?: string;
  user_id?: string;
}

export interface AIPerformanceMetrics {
  function_name: string;
  response_time_ms: number;
  success: boolean;
  error_message?: string;
  tokens_used?: number;
  model_used: string;
  input_size: number;
  output_size: number;
}

export interface UserInteractionMetrics {
  component: string;
  action: string;
  value?: string | number;
  duration_ms?: number;
  success: boolean;
  error_message?: string;
}

/**
 * 📊 COMPREHENSIVE ANALYTICS TRACKING HOOK
 * - Real-time user interaction tracking
 * - AI performance monitoring
 * - Journey completion metrics
 * - Error tracking och debugging
 * - Session management
 */
export const useAnalyticsTracking = () => {
  const { user } = useAuth();
  const sessionIdRef = useRef<string>();
  const pageStartTimeRef = useRef<number>(Date.now());
  const interactionBufferRef = useRef<AnalyticsEventData[]>([]);
  const flushTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize session
  useEffect(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }, []);

  // Flush analytics buffer to Supabase
  const flushAnalyticsBuffer = useCallback(async () => {
    if (interactionBufferRef.current.length === 0) return;

    const events = [...interactionBufferRef.current];
    interactionBufferRef.current = [];

    try {
      // Using direct HTTP call to bypass TypeScript issues with new table
      const eventsPayload = events.map(event => ({
        ...event,
        user_id: user?.id || null,
        session_id: sessionIdRef.current,
        timestamp: event.timestamp || new Date().toISOString(),
        page_url: window.location.href,
        user_agent: navigator.userAgent
      }));

      const response = await fetch(`https://gcoorbcglxczmukzcmqs.supabase.co/rest/v1/analytics_events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjb29yYmNnbHhjem11a3pjbXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTE3NzYsImV4cCI6MjA2OTM4Nzc3Nn0.5gNGvMZ6aG3UXoYR6XbJPqn8L8ktMYaFbZIQ4mZTFf4',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(eventsPayload)
      });

      if (!response.ok) {
        throw new Error(`Analytics insert failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Analytics network error:', error);
      // Re-add events to buffer if failed
      interactionBufferRef.current.unshift(...events);
    }
  }, [user?.id]);

  // Flush analytics buffer periodically - REDUCED FREQUENCY
  useEffect(() => {
    const flushInterval = setInterval(() => {
      if (interactionBufferRef.current.length > 0) {
        flushAnalyticsBuffer();
      }
    }, 30000); // Flush every 30 seconds instead of 10

    return () => {
      clearInterval(flushInterval);
      if (interactionBufferRef.current.length > 0) {
        flushAnalyticsBuffer(); // Flush on unmount
      }
    };
  }, [flushAnalyticsBuffer]);

  // Track generic analytics event - THROTTLED
  const trackEvent = useCallback((event: AnalyticsEvent, properties: Record<string, any> = {}) => {
    // Throttle non-critical events
    if (!['error_occurred', 'assessment_completed'].includes(event) && 
        interactionBufferRef.current.length > 50) {
      return; // Skip if buffer is too full
    }

    const eventData: AnalyticsEventData = {
      event,
      properties: {
        ...properties,
        timestamp: Date.now()
      },
      timestamp: new Date().toISOString()
    };

    interactionBufferRef.current.push(eventData);

    // Flush immediately for critical events only
    if (['error_occurred', 'assessment_completed'].includes(event)) {
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
      flushTimeoutRef.current = setTimeout(flushAnalyticsBuffer, 2000);
    }
  }, [flushAnalyticsBuffer]);

  // Track page views
  const trackPageView = useCallback((pageName: string, additionalProps: Record<string, any> = {}) => {
    const timeOnPreviousPage = Date.now() - pageStartTimeRef.current;
    
    trackEvent('page_view', {
      page_name: pageName,
      time_on_previous_page_ms: timeOnPreviousPage,
      referrer: document.referrer,
      ...additionalProps
    });

    pageStartTimeRef.current = Date.now();
  }, [trackEvent]);

  // Track user interactions
  const trackUserAction = useCallback((action: string, component: string, value?: any) => {
    trackEvent('user_action', {
      action,
      component,
      value,
      timestamp: Date.now()
    });
  }, [trackEvent]);

  // Track AI interactions with performance metrics
  const trackAIInteraction = useCallback((metrics: AIPerformanceMetrics) => {
    trackEvent('ai_interaction', {
      function_name: metrics.function_name,
      response_time_ms: metrics.response_time_ms,
      success: metrics.success,
      error_message: metrics.error_message,
      tokens_used: metrics.tokens_used,
      model_used: metrics.model_used,
      input_size: metrics.input_size,
      output_size: metrics.output_size,
      performance_score: metrics.response_time_ms < 2000 ? 'excellent' : 
                         metrics.response_time_ms < 5000 ? 'good' : 'needs_improvement'
    });
  }, [trackEvent]);

  // Track assessment completion
  const trackAssessmentCompleted = useCallback((assessmentType: string, score: number, duration: number) => {
    trackEvent('assessment_completed', {
      assessment_type: assessmentType,
      score,
      completion_time_ms: duration,
      completion_rate: 100, // Completed
      timestamp: Date.now()
    });
  }, [trackEvent]);

  // Track task creation and completion
  const trackTaskAction = useCallback((action: 'created' | 'completed', taskData: any) => {
    const eventType = action === 'created' ? 'task_created' : 'task_completed';
    
    trackEvent(eventType, {
      task_id: taskData.id,
      task_title: taskData.title,
      category: taskData.category,
      priority: taskData.priority,
      ai_generated: taskData.ai_generated || false,
      neuroplastic_principle: taskData.neuroplastic_data?.principle,
      estimated_duration: taskData.neuroplastic_data?.duration_days
    });
  }, [trackEvent]);

  // Track journey step completion
  const trackJourneyStep = useCallback((stepId: string, stepIndex: number, totalSteps: number) => {
    trackEvent('journey_step_completed', {
      step_id: stepId,
      step_index: stepIndex,
      total_steps: totalSteps,
      completion_percentage: ((stepIndex + 1) / totalSteps) * 100,
      time_to_complete: Date.now() - pageStartTimeRef.current
    });
  }, [trackEvent]);

  // Track errors
  const trackError = useCallback((error: Error, context: string, additionalData?: Record<string, any>) => {
    trackEvent('error_occurred', {
      error_message: error.message,
      error_stack: error.stack,
      context,
      timestamp: Date.now(),
      url: window.location.href,
      ...additionalData
    });
  }, [trackEvent]);

  // Track performance metrics
  const trackPerformance = useCallback((metricName: string, value: number, unit: string = 'ms') => {
    trackEvent('performance_metric', {
      metric_name: metricName,
      value,
      unit,
      timestamp: Date.now(),
      page_url: window.location.href
    });
  }, [trackEvent]);

  // Get analytics session info
  const getSessionInfo = useCallback(() => {
    return {
      session_id: sessionIdRef.current,
      user_id: user?.id,
      session_duration: Date.now() - pageStartTimeRef.current,
      events_in_buffer: interactionBufferRef.current.length
    };
  }, [user?.id]);

  return {
    trackEvent,
    trackPageView,
    trackUserAction,
    trackAIInteraction,
    trackAssessmentCompleted,
    trackTaskAction,
    trackJourneyStep,
    trackError,
    trackPerformance,
    getSessionInfo,
    flushAnalyticsBuffer
  };
};

/**
 * 📈 ANALYTICS PROVIDER HOOK
 * Wrapper för automatic page tracking
 */
export const useAnalyticsProvider = (pageName: string) => {
  const analytics = useAnalyticsTracking();

  useEffect(() => {
    analytics.trackPageView(pageName);
  }, [analytics, pageName]);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      analytics.trackError(
        new Error(event.message),
        'window_error',
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      analytics.trackError(
        new Error(event.reason),
        'unhandled_promise_rejection'
      );
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [analytics]);

  return analytics;
};