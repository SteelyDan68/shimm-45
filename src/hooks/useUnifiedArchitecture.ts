/**
 * 🏗️ UNIFIED HOOK ARCHITECTURE V2
 * SCRUM-TEAM SOLUTION ARCHITECT IMPLEMENTATION
 * 
 * Konsoliderar redundanta hooks och skapar centralized functionality
 * Budget: 1 miljard kronor development standard
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMemoryOptimization, usePerformanceMonitoringV2 } from '@/utils/performanceOptimizationV2';

/**
 * 🎯 UNIFIED DATA ACCESS LAYER
 * Ersätter flera redundanta hooks med en centraliserad data access pattern
 */
export const useUnifiedDataAccess = () => {
  usePerformanceMonitoringV2('UnifiedDataAccess');
  const { registerCleanup } = useMemoryOptimization();
  
  const { user, hasRole } = useAuth();
  const { toast } = useToast();

  // OPTIMIZED: Memoized permission checker
  const checkPermission = useCallback((operation: string, target?: string) => {
    if (!user) return false;
    
    // Admin/Superadmin can do everything
    if (hasRole('admin') || hasRole('superadmin')) return true;
    
    // Coach permissions
    if (hasRole('coach')) {
      return ['read_clients', 'create_tasks', 'view_analytics'].includes(operation);
    }
    
    // Client permissions - only own data
    if (hasRole('client')) {
      return operation === 'read_own_data' && target === user.id;
    }
    
    return false;
  }, [user, hasRole]);

  // OPTIMIZED: Unified query builder with proper typing
  const buildQuery = useCallback((tableName: string, filters?: Record<string, any>) => {
    // Use generic string access since we can't predict all table names
    const query = supabase.from(tableName as any).select('*');
    
    if (filters) {
      let filteredQuery = query;
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          filteredQuery = filteredQuery.eq(key, value);
        }
      });
      return filteredQuery;
    }
    
    return query;
  }, []);

  // OPTIMIZED: Safe data operation with error handling
  const executeOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    errorMessage = 'Operation failed',
    successMessage?: string
  ): Promise<T | null> => {
    try {
      const result = await operation();
      
      if (successMessage) {
        toast({
          title: "Success",
          description: successMessage,
        });
      }
      
      return result;
    } catch (error: any) {
      console.error('Operation failed:', error);
      
      toast({
        title: "Error",
        description: error.message || errorMessage,
        variant: "destructive"
      });
      
      return null;
    }
  }, [toast]);

  return {
    checkPermission,
    buildQuery,
    executeOperation,
    user,
    hasRole
  };
};

/**
 * 🔄 UNIFIED STATE MANAGEMENT
 * Centraliserar state management patterns som används genomgående
 */
export const useUnifiedState = <T>(initialValue: T) => {
  const { registerCleanup } = useMemoryOptimization();
  
  const [state, setState] = useState<T>(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateState = useCallback((newState: T | ((prev: T) => T)) => {
    setState(newState);
    setError(null); // Clear errors on successful update
  }, []);

  const withLoading = useCallback(async <R>(operation: () => Promise<R>): Promise<R | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      return result;
    } catch (err: any) {
      setError(err.message || 'Operation failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    registerCleanup(() => {
      setState(initialValue);
      setError(null);
      setLoading(false);
    });
  }, [registerCleanup, initialValue]);

  return {
    state,
    loading,
    error,
    updateState,
    withLoading,
    setLoading,
    setError
  };
};

/**
 * 📊 UNIFIED ANALYTICS TRACKING
 * Konsoliderar alla analytics calls till en centraliserad service
 */
export const useUnifiedAnalytics = () => {
  const { user } = useAuth();
  const { executeOperation } = useUnifiedDataAccess();

  const trackEvent = useCallback(async (
    event: string,
    properties?: Record<string, any>,
    metadata?: Record<string, any>
  ) => {
    if (!user) return;

    return executeOperation(
      async () => {
        const { data, error } = await supabase.from('analytics_events').insert({
          user_id: user.id,
          event,
          properties: {
            ...properties,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            page_url: window.location.href
          },
          session_id: `session_${Date.now()}`,
          page_url: window.location.href,
          metadata
        });
        
        if (error) throw error;
        return data;
      },
      'Failed to track analytics event'
    );
  }, [user, executeOperation]);

  const trackPerformance = useCallback((metric: string, value: number, context?: any) => {
    return trackEvent('performance_metric', {
      metric,
      value,
      context
    });
  }, [trackEvent]);

  const trackUserAction = useCallback((action: string, target?: string, result?: 'success' | 'error') => {
    return trackEvent('user_action', {
      action,
      target,
      result
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPerformance,
    trackUserAction
  };
};

/**
 * 🔔 UNIFIED NOTIFICATION SYSTEM
 * Centraliserar alla notification patterns
 */
export const useUnifiedNotifications = () => {
  const { toast } = useToast();
  const { trackEvent } = useUnifiedAnalytics();

  const showSuccess = useCallback((title: string, description?: string) => {
    toast({
      title,
      description,
    });
    trackEvent('notification_shown', { type: 'success', title });
  }, [toast, trackEvent]);

  const showError = useCallback((title: string, description?: string, error?: Error) => {
    toast({
      title,
      description,
      variant: "destructive"
    });
    trackEvent('notification_shown', { 
      type: 'error', 
      title, 
      error_message: error?.message 
    });
  }, [toast, trackEvent]);

  const showWarning = useCallback((title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default" // Customize for warning style
    });
    trackEvent('notification_shown', { type: 'warning', title });
  }, [toast, trackEvent]);

  const showInfo = useCallback((title: string, description?: string) => {
    toast({
      title,
      description,
    });
    trackEvent('notification_shown', { type: 'info', title });
  }, [toast, trackEvent]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

/**
 * 🎯 UNIFIED FORM HANDLING
 * Standardiserar alla form patterns i systemet
 */
export const useUnifiedForm = <T extends Record<string, any>>(
  initialData: T,
  validationRules?: Record<keyof T, (value: any) => string | null>
) => {
  const { state: formData, updateState: setFormData, loading, error, withLoading } = useUnifiedState(initialData);
  const { showError, showSuccess } = useUnifiedNotifications();
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof T, string>>>({});

  const updateField = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error on change
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [setFormData, fieldErrors]);

  const validateForm = useCallback((): boolean => {
    if (!validationRules) return true;
    
    const errors: Partial<Record<keyof T, string>> = {};
    let isValid = true;
    
    Object.entries(validationRules).forEach(([field, validator]) => {
      const error = validator(formData[field as keyof T]);
      if (error) {
        errors[field as keyof T] = error;
        isValid = false;
      }
    });
    
    setFieldErrors(errors);
    return isValid;
  }, [formData, validationRules]);

  const submitForm = useCallback(async (
    submitHandler: (data: T) => Promise<any>,
    successMessage?: string
  ) => {
    if (!validateForm()) {
      showError('Validation Error', 'Please fix the form errors');
      return null;
    }

    return withLoading(async () => {
      const result = await submitHandler(formData);
      if (successMessage) {
        showSuccess('Success', successMessage);
      }
      return result;
    });
  }, [formData, validateForm, withLoading, showError, showSuccess]);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setFieldErrors({});
  }, [setFormData, initialData]);

  return {
    formData,
    fieldErrors,
    loading,
    error,
    updateField,
    validateForm,
    submitForm,
    resetForm
  };
};

export default {
  useUnifiedDataAccess,
  useUnifiedState,
  useUnifiedAnalytics,
  useUnifiedNotifications,
  useUnifiedForm
};