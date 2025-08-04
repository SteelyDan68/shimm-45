import { useUnifiedAI } from './useUnifiedAI';

/**
 * 🎯 SIMPLIFIED STEFAN AI HOOK
 * Wrapper around useUnifiedAI for easier Stefan-specific usage
 * Provides clean API för Stefan AI interactions
 */
export const useStefanAI = () => {
  const unifiedAI = useUnifiedAI();

  return {
    // Stefan-specific methods
    chat: unifiedAI.stefanChat,
    coaching: unifiedAI.coachingAnalysis,
    assessment: unifiedAI.assessmentAnalysis,
    
    // System status
    loading: unifiedAI.loading,
    error: unifiedAI.error,
    health: unifiedAI.healthCheck,
    
    // Advanced features
    batchProcess: unifiedAI.batchProcess,
    circuitBreakerStatus: unifiedAI.circuitBreakerStatus
  };
};

export default useStefanAI;