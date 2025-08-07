import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface IntelligenceDataPoint {
  id: string;
  user_id: string;
  data_type: string;
  content?: any;
  data?: any; // For compatibility with existing database schema
  source?: string;
  collected_at?: string;
  created_at: string;
}

export interface NewsItem {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  formattedUrl?: string;
  htmlTitle?: string;
  htmlSnippet?: string;
  collected_at: string;
  search_query: string;
}

export interface SocialMetric {
  platform: string;
  handle: string;
  metrics: {
    followers: number;
    following: number;
    posts: number;
    engagement_rate: number;
    last_post_date: string;
    [key: string]: any;
  };
  collected_at: string;
  data_source: string;
}

export interface WebResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  collected_at: string;
  search_query: string;
}

export interface AIAnalysis {
  analysis_type: string;
  content: string;
  generated_at: string;
  confidence_score: number;
  data_sources: string[];
}

export const useIntelligenceData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [data, setData] = useState<IntelligenceDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntelligenceData = useCallback(async (userId?: string) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return;

    try {
      setLoading(true);
      setError(null);

      const { data: intelligenceData, error: fetchError } = await supabase
        .from('user_data_cache')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Transform data to match our interface
      const transformedData: IntelligenceDataPoint[] = (intelligenceData || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        data_type: item.data_type,
        content: item.data || item.content || {},
        source: item.source || 'unknown',
        collected_at: item.collected_at || item.created_at,
        created_at: item.created_at
      }));

      setData(transformedData);
    } catch (err: any) {
      console.error('Intelligence data fetch error:', err);
      setError(err.message);
      toast({
        title: "Fel vid datahämtning",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const triggerDataCollection = useCallback(async (userId?: string, forceRefresh = false) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return false;

    try {
      setLoading(true);

      const { data: result, error } = await supabase.functions.invoke('data-collector', {
        body: {
          client_id: targetUserId,
          timestamp: new Date().toISOString(),
          force_refresh: forceRefresh
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Data collection failed');
      }

      toast({
        title: "Datainsamling lyckades",
        description: `${result.result?.total_data_points || 0} datapunkter insamlade`,
      });

      // Refresh the data after collection
      await fetchIntelligenceData(targetUserId);
      return true;

    } catch (err: any) {
      console.error('Data collection error:', err);
      toast({
        title: "Datainsamling misslyckades",
        description: err.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast, fetchIntelligenceData]);

  // Filtered data getters
  const getNewsData = useCallback((): NewsItem[] => {
    return data
      .filter(item => item.data_type === 'news')
      .map(item => item.content as NewsItem);
  }, [data]);

  const getSocialMetrics = useCallback((): SocialMetric[] => {
    return data
      .filter(item => item.data_type === 'social_metrics')
      .map(item => item.content as SocialMetric);
  }, [data]);

  const getWebResults = useCallback((): WebResult[] => {
    return data
      .filter(item => item.data_type === 'web_search')
      .map(item => item.content as WebResult);
  }, [data]);

  const getAIAnalyses = useCallback((): AIAnalysis[] => {
    return data
      .filter(item => item.data_type === 'ai_analysis')
      .map(item => item.content as AIAnalysis);
  }, [data]);

  // Statistics
  const getStats = useCallback(() => {
    const news = getNewsData();
    const social = getSocialMetrics();
    const web = getWebResults();
    const ai = getAIAnalyses();

    return {
      total_data_points: data.length,
      news_articles: news.length,
      social_platforms: social.length,
      web_references: web.length,
      ai_analyses: ai.length,
      last_updated: data.length > 0 ? data[0].created_at : null
    };
  }, [data, getNewsData, getSocialMetrics, getWebResults, getAIAnalyses]);

  // Real-time updates
  useEffect(() => {
    if (!user?.id) return;

    fetchIntelligenceData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('intelligence-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_data_cache',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New intelligence data received:', payload);
          fetchIntelligenceData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchIntelligenceData]);

  return {
    // Core data
    data,
    loading,
    error,
    
    // Actions
    fetchIntelligenceData,
    triggerDataCollection,
    
    // Filtered data getters
    getNewsData,
    getSocialMetrics, 
    getWebResults,
    getAIAnalyses,
    
    // Statistics
    getStats
  };
};