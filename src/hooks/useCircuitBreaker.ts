import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

/**
 * 🔌 CIRCUIT BREAKER PATTERN Implementation
 * - Prevents cascade failures när AI services är nere
 * - Automatic recovery med exponential backoff
 * - Real-time monitoring och alerting
 * - Graceful degradation för better UX
 */
export const useCircuitBreaker = (
  serviceKey: string,
  config: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    monitoringPeriod: 300000 // 5 minutes
  }
) => {
  const { toast } = useToast();
  
  const [circuitState, setCircuitState] = useState<CircuitBreakerState>({
    state: 'CLOSED',
    failureCount: 0,
    lastFailureTime: 0,
    nextAttemptTime: 0
  });

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(`circuit_breaker_${serviceKey}`);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setCircuitState(parsed);
      } catch (error) {
        console.error('Failed to parse circuit breaker state:', error);
      }
    }
  }, [serviceKey]);

  // Save state to localStorage
  const saveState = useCallback((state: CircuitBreakerState) => {
    localStorage.setItem(`circuit_breaker_${serviceKey}`, JSON.stringify(state));
    setCircuitState(state);
  }, [serviceKey]);

  // Check if circuit should transition to HALF_OPEN
  const checkForRecovery = useCallback(() => {
    const now = Date.now();
    if (circuitState.state === 'OPEN' && now >= circuitState.nextAttemptTime) {
      saveState({
        ...circuitState,
        state: 'HALF_OPEN'
      });
      return true;
    }
    return false;
  }, [circuitState, saveState]);

  // Record a successful operation
  const recordSuccess = useCallback(() => {
    if (circuitState.state === 'HALF_OPEN') {
      // Recovery successful - close circuit
      saveState({
        state: 'CLOSED',
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0
      });
      
      toast({
        title: "Service återställt",
        description: `${serviceKey} är tillgängligt igen.`,
        duration: 3000
      });
    } else if (circuitState.failureCount > 0) {
      // Reset failure count on successful operation
      saveState({
        ...circuitState,
        failureCount: 0
      });
    }
  }, [circuitState, saveState, serviceKey, toast]);

  // Record a failed operation
  const recordFailure = useCallback((error: Error) => {
    const now = Date.now();
    const newFailureCount = circuitState.failureCount + 1;
    
    let newState: CircuitState = circuitState.state;
    let nextAttemptTime = circuitState.nextAttemptTime;
    
    // Check if we should open the circuit
    if (newFailureCount >= config.failureThreshold && circuitState.state === 'CLOSED') {
      newState = 'OPEN';
      nextAttemptTime = now + config.resetTimeout;
      
      toast({
        title: "Service temporärt otillgänglig",
        description: `${serviceKey} har för många fel. Försöker igen automatiskt.`,
        variant: "destructive",
        duration: 5000
      });
    } else if (circuitState.state === 'HALF_OPEN') {
      // Failed during recovery attempt - back to OPEN
      newState = 'OPEN';
      nextAttemptTime = now + config.resetTimeout * 2; // Exponential backoff
    }
    
    saveState({
      state: newState,
      failureCount: newFailureCount,
      lastFailureTime: now,
      nextAttemptTime
    });
    
    // Log failure for monitoring
    console.error(`Circuit Breaker [${serviceKey}]: Failure recorded`, {
      error: error.message,
      failureCount: newFailureCount,
      state: newState,
      threshold: config.failureThreshold
    });
  }, [circuitState, config, saveState, serviceKey, toast]);

  // Check if operation should be allowed
  const isOperationAllowed = useCallback(() => {
    checkForRecovery();
    
    switch (circuitState.state) {
      case 'CLOSED':
        return true;
      case 'HALF_OPEN':
        return true; // Allow one test request
      case 'OPEN':
        return false;
      default:
        return false;
    }
  }, [circuitState.state, checkForRecovery]);

  // Execute operation with circuit breaker protection
  const executeWithCircuitBreaker = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    if (!isOperationAllowed()) {
      const timeUntilRetry = Math.max(0, circuitState.nextAttemptTime - Date.now());
      throw new Error(
        `Service ${serviceKey} är temporärt otillgänglig. Försök igen om ${Math.ceil(timeUntilRetry / 1000)} sekunder.`
      );
    }
    
    try {
      const result = await operation();
      recordSuccess();
      return result;
    } catch (error) {
      recordFailure(error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }, [isOperationAllowed, circuitState.nextAttemptTime, serviceKey, recordSuccess, recordFailure]);

  // Get current status for monitoring
  const getStatus = useCallback(() => {
    const now = Date.now();
    return {
      state: circuitState.state,
      failureCount: circuitState.failureCount,
      isHealthy: circuitState.state === 'CLOSED' && circuitState.failureCount === 0,
      timeUntilRetry: circuitState.state === 'OPEN' ? 
        Math.max(0, circuitState.nextAttemptTime - now) : 0,
      lastFailureTime: circuitState.lastFailureTime,
      config
    };
  }, [circuitState, config]);

  // Reset circuit breaker manually
  const resetCircuitBreaker = useCallback(() => {
    saveState({
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0
    });
    
    toast({
      title: "Circuit breaker återställd",
      description: `${serviceKey} är nu tillgänglig för nya försök.`
    });
  }, [saveState, serviceKey, toast]);

  return {
    executeWithCircuitBreaker,
    getStatus,
    resetCircuitBreaker,
    isOperationAllowed: isOperationAllowed(),
    state: circuitState.state,
    failureCount: circuitState.failureCount
  };
};

/**
 * 🛡️ AI SERVICE CIRCUIT BREAKER Hook
 * Specialized circuit breaker för AI services
 */
export const useAIServiceCircuitBreaker = () => {
  const openaiCircuit = useCircuitBreaker('openai', {
    failureThreshold: 3,
    resetTimeout: 30000, // 30 seconds
    monitoringPeriod: 180000 // 3 minutes
  });
  
  const geminiCircuit = useCircuitBreaker('gemini', {
    failureThreshold: 3,
    resetTimeout: 45000, // 45 seconds  
    monitoringPeriod: 180000 // 3 minutes
  });
  
  const unifiedAICircuit = useCircuitBreaker('unified-ai', {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    monitoringPeriod: 300000 // 5 minutes
  });

  // Get overall AI health status
  const getOverallStatus = useCallback(() => {
    const openaiStatus = openaiCircuit.getStatus();
    const geminiStatus = geminiCircuit.getStatus();
    const unifiedStatus = unifiedAICircuit.getStatus();
    
    const allHealthy = openaiStatus.isHealthy && geminiStatus.isHealthy && unifiedStatus.isHealthy;
    const anyAvailable = openaiCircuit.isOperationAllowed || geminiCircuit.isOperationAllowed;
    
    return {
      overall: allHealthy ? 'healthy' : anyAvailable ? 'degraded' : 'down',
      services: {
        openai: openaiStatus,
        gemini: geminiStatus,
        unifiedAI: unifiedStatus
      },
      recommendations: {
        useBackup: !openaiCircuit.isOperationAllowed && geminiCircuit.isOperationAllowed,
        showFallback: !anyAvailable,
        showWarning: !allHealthy && anyAvailable
      }
    };
  }, [openaiCircuit, geminiCircuit, unifiedAICircuit]);

  return {
    openai: openaiCircuit,
    gemini: geminiCircuit,
    unifiedAI: unifiedAICircuit,
    getOverallStatus
  };
};