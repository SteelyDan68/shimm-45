import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';

export interface StefanInsight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'critical';
  title: string;
  description: string;
  actionText?: string;
  priority: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

export interface PriorityAction {
  id: string;
  title: string;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  count: number;
  type: string;
}

export interface PillarStats {
  [pillarName: string]: {
    avgScore: number;
    totalAssessments: number;
    completionRate: number;
  };
}

export interface AdminLiveInsights {
  insights: StefanInsight[];
  priorityActions: PriorityAction[];
  pillarStats: PillarStats;
  stefanInsights: {
    totalRecommendations: number;
    pendingRecommendations: number;
    completedRecommendations: number;
    criticalRecommendations: number;
  };
  clientsData: {
    total: number;
    inactive: number;
    active: number;
  };
  generatedAt: string;
}

export const useAdminLiveInsights = () => {
  const { user, hasRole } = useAuth();
  const [insights, setInsights] = useState<AdminLiveInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchLiveInsights = useCallback(async () => {
    if (!user || (!hasRole('admin') && !hasRole('superadmin'))) {
      setError('Unauthorized access');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🎯 Fetching live admin insights...');

      const { data, error: functionError } = await supabase.functions.invoke(
        'admin-live-insights',
        {
          body: {
            timeRange: '7d',
            includeDetails: true
          }
        }
      );

      if (functionError) {
        console.error('Function error:', functionError);
        throw functionError;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch admin insights');
      }

      console.log('✅ Admin insights loaded:', data.data);
      setInsights(data.data);
      setLastUpdated(new Date());

    } catch (err: any) {
      console.error('❌ Error fetching admin insights:', err);
      setError(err.message || 'Failed to fetch admin insights');
      
      // Fallback minimal insights if edge function fails
      setInsights({
        insights: [
          {
            id: 'fallback-info',
            type: 'info',
            title: 'Live insights laddas',
            description: 'Stefan AI analyserar systemdata för att generera insights...',
            priority: 'low'
          }
        ],
        priorityActions: [],
        pillarStats: {},
        stefanInsights: {
          totalRecommendations: 0,
          pendingRecommendations: 0,
          completedRecommendations: 0,
          criticalRecommendations: 0
        },
        clientsData: {
          total: 0,
          inactive: 0,
          active: 0
        },
        generatedAt: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  }, [user, hasRole]);

  // Setup real-time updates
  useEffect(() => {
    fetchLiveInsights();

    if (!user || (!hasRole('admin') && !hasRole('superadmin'))) {
      return;
    }

    // Listen for changes that affect insights
    const insightsChannel = supabase
      .channel('admin-insights-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ai_coaching_recommendations' },
        () => {
          console.log('🔄 AI recommendations changed, refreshing insights...');
          fetchLiveInsights();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'assessment_rounds' },
        () => {
          console.log('🔄 Assessments changed, refreshing insights...');
          setTimeout(fetchLiveInsights, 5000); // Throttled update
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'path_entries' },
        () => {
          console.log('🔄 Path entries changed, refreshing insights...');
          setTimeout(fetchLiveInsights, 10000); // Throttled update
        }
      )
      .subscribe();

    // Auto-refresh every 5 minutes
    const refreshInterval = setInterval(fetchLiveInsights, 5 * 60 * 1000);

    return () => {
      supabase.removeChannel(insightsChannel);
      clearInterval(refreshInterval);
    };
  }, [user, hasRole, fetchLiveInsights]);

  const refreshInsights = () => {
    fetchLiveInsights();
  };

  return {
    insights,
    loading,
    error,
    lastUpdated,
    refreshInsights,
    hasAccess: user && (hasRole('admin') || hasRole('superadmin'))
  };
};