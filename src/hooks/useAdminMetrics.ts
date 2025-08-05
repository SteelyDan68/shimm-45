import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';

export interface AdminMetrics {
  totalClients: number;
  clientsNeedingAttention: number;
  avgProgress: number;
  avgVelocity: number;
  activePillarsTotal: number;
  totalBarriers: number;
  systemHealth: number;
  engagementDistribution: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface ClientOutcome {
  client_id: string;
  client_name: string;
  overall_progress: number;
  active_pillars: number;
  velocity_score: number;
  engagement_level: 'high' | 'medium' | 'low';
  needs_attention: boolean;
  last_activity: string;
  barriers: string[];
  recent_wins: string[];
  pillar_scores: Record<string, number>;
}

export interface SystemAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

export const useAdminMetrics = (timeRange: string = 'week') => {
  const { user, hasRole } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [clientOutcomes, setClientOutcomes] = useState<ClientOutcome[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    if (!user || (!hasRole('admin') && !hasRole('superadmin'))) {
      setError('Unauthorized access');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Anropa vår nya edge function för aggregerad data
      const { data, error: functionError } = await supabase.functions.invoke(
        'admin-realtime-aggregation',
        {
          body: {
            time_range: timeRange,
            include_realtime: true
          }
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch admin data');
      }

      // Uppdatera state med aggregerad data
      setMetrics(data.data.metrics);
      setClientOutcomes(data.data.clientOutcomes);
      setSystemAlerts(data.data.systemAlerts);

    } catch (err: any) {
      console.error('Error fetching admin metrics:', err);
      setError(err.message || 'Failed to fetch admin data');
      
      // Development fallback disabled
      if (process.env.NODE_ENV === 'development') {
        setMetrics({
          totalClients: 25,
          clientsNeedingAttention: 3,
          avgProgress: 67,
          avgVelocity: 58,
          activePillarsTotal: 87,
          totalBarriers: 12,
          systemHealth: 94,
          engagementDistribution: {
            high: 15,
            medium: 8,
            low: 2
          }
        });
        
        setSystemAlerts([
          {
            id: 'mock-alert',
            type: 'info',
            title: 'System Operating Normally',
            description: 'Alla system fungerar som förväntat',
            timestamp: new Date().toISOString(),
            resolved: true
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Uppdatera data när timeRange ändras
  useEffect(() => {
    fetchAdminData();
  }, [timeRange, user]);

  // Setup realtidsuppdateringar
  useEffect(() => {
    if (!user || (!hasRole('admin') && !hasRole('superadmin'))) {
      return;
    }

    // Lyssna på förändringar i pillar_assessments
    const assessmentChannel = supabase
      .channel('admin-assessments')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'pillar_assessments' },
        () => {
          // Uppdatera data när nya assessments skapas
          fetchAdminData();
        }
      )
      .subscribe();

    // Lyssna på förändringar i path_entries
    const pathChannel = supabase
      .channel('admin-path-entries')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'path_entries' },
        () => {
          // Uppdatera när nya path entries skapas
          fetchAdminData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(assessmentChannel);
      supabase.removeChannel(pathChannel);
    };
  }, [user, hasRole]);

  const refreshData = () => {
    fetchAdminData();
  };

  const exportData = () => {
    const exportData = {
      metrics,
      clientOutcomes,
      systemAlerts,
      timeRange,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-metrics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    metrics,
    clientOutcomes,
    systemAlerts,
    loading,
    error,
    refreshData,
    exportData,
    hasAccess: user && (hasRole('admin') || hasRole('superadmin'))
  };
};