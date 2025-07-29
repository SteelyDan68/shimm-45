import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CacheData {
  id: string;
  data_type: string;
  source: string;
  data: any;
  created_at: string;
  metadata?: any;
}

export const useClientData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getClientCacheData = async (clientId: string): Promise<CacheData[]> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_data_cache')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cache data:', error);
        toast({
          title: "Fel",
          description: "Kunde inte hämta klientdata",
          variant: "destructive",
        });
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getClientCacheData:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getNewsMentions = (cacheData: CacheData[]) => {
    return cacheData
      .filter(item => item.data_type === 'news')
      .slice(0, 5); // Latest 5 news items
  };

  const getSocialMetrics = (cacheData: CacheData[]) => {
    const socialData = cacheData.filter(item => item.data_type === 'social_metrics');
    // Return all social metrics, not just the first one
    return socialData.length > 0 ? socialData : [];
  };

  const getAIAnalysis = (cacheData: CacheData[]) => {
    return cacheData
      .filter(item => item.data_type === 'ai_analysis')
      .slice(0, 3); // Latest 3 AI analyses
  };

  return {
    getClientCacheData,
    getNewsMentions,
    getSocialMetrics,
    getAIAnalysis,
    isLoading
  };
};