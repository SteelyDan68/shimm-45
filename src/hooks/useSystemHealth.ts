import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAI } from '@/hooks/useUnifiedAI';

export interface SystemHealthStatus {
  api: 'healthy' | 'degraded' | 'down' | 'unknown';
  database: 'healthy' | 'degraded' | 'down' | 'unknown';
  ai: 'healthy' | 'degraded' | 'down' | 'unknown';
  storage: 'healthy' | 'degraded' | 'down' | 'unknown';
  overall: 'healthy' | 'degraded' | 'down' | 'unknown';
  lastCheck: string;
  response_times: {
    api: number;
    database: number;
    ai: number;
    storage: number;
  };
}

export const useSystemHealth = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { healthCheck } = useUnifiedAI();

  const checkSystemHealth = async (): Promise<SystemHealthStatus> => {
    const startTime = Date.now();
    const response_times = { api: 0, database: 0, ai: 0, storage: 0 };
    
    // Test API health
    const apiStart = Date.now();
    let apiStatus: SystemHealthStatus['api'] = 'unknown';
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      response_times.api = Date.now() - apiStart;
      apiStatus = error ? 'degraded' : 'healthy';
    } catch {
      response_times.api = Date.now() - apiStart;
      apiStatus = 'down';
    }

    // Test database health
    const dbStart = Date.now();
    let dbStatus: SystemHealthStatus['database'] = 'unknown';
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('id')
        .limit(1);
      response_times.database = Date.now() - dbStart;
      dbStatus = error ? 'degraded' : 'healthy';
    } catch {
      response_times.database = Date.now() - dbStart;
      dbStatus = 'down';
    }

    // Test AI health
    const aiStart = Date.now();
    let aiStatus: SystemHealthStatus['ai'] = 'unknown';
    try {
      const aiHealth = await healthCheck();
      response_times.ai = Date.now() - aiStart;
      aiStatus = aiHealth.status === 'healthy' ? 'healthy' : 
                 aiHealth.status === 'degraded' ? 'degraded' : 'down';
    } catch {
      response_times.ai = Date.now() - aiStart;
      aiStatus = 'down';
    }

    // Test storage health
    const storageStart = Date.now();
    let storageStatus: SystemHealthStatus['storage'] = 'unknown';
    try {
      const { data, error } = await supabase.storage.listBuckets();
      response_times.storage = Date.now() - storageStart;
      storageStatus = error ? 'degraded' : 'healthy';
    } catch {
      response_times.storage = Date.now() - storageStart;
      storageStatus = 'down';
    }

    // Calculate overall status
    const statuses = [apiStatus, dbStatus, aiStatus, storageStatus];
    const overall: SystemHealthStatus['overall'] = 
      statuses.includes('down') ? 'down' :
      statuses.includes('degraded') ? 'degraded' : 'healthy';

    return {
      api: apiStatus,
      database: dbStatus,
      ai: aiStatus,
      storage: storageStatus,
      overall,
      lastCheck: new Date().toISOString(),
      response_times
    };
  };

  useEffect(() => {
    const performHealthCheck = async () => {
      setLoading(true);
      try {
        const health = await checkSystemHealth();
        setSystemHealth(health);
      } catch (error) {
        console.error('Health check failed:', error);
        setSystemHealth({
          api: 'unknown',
          database: 'unknown',
          ai: 'unknown',
          storage: 'unknown',
          overall: 'unknown',
          lastCheck: new Date().toISOString(),
          response_times: { api: 0, database: 0, ai: 0, storage: 0 }
        });
      } finally {
        setLoading(false);
      }
    };

    performHealthCheck();

    // Check health every 30 seconds
    const interval = setInterval(performHealthCheck, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    data: systemHealth,
    loading,
    refetch: checkSystemHealth
  };
};