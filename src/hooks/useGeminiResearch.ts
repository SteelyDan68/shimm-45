import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ResearchResult {
  category: string;
  title: string;
  query: string;
  result: string;
  timestamp: string;
}

interface GeminiResearchData {
  query_type: string;
  research_results: ResearchResult[];
  timestamp: string;
}

export const useGeminiResearch = () => {
  const [isResearching, setIsResearching] = useState(false);
  const { toast } = useToast();

  const performResearch = async (
    clientId: string, 
    queryType: 'comprehensive' | 'quick' = 'comprehensive'
  ): Promise<GeminiResearchData | null> => {
    setIsResearching(true);
    
    try {
      console.log('Starting Gemini research for client:', clientId);
      
      const { data, error } = await supabase.functions.invoke('gemini-research', {
        body: { 
          client_id: clientId,
          query_type: queryType
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Research fel: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Okänt fel vid research');
      }

      toast({
        title: "Web-research klar",
        description: `Färsk data insamlad för ${data.client_name}`,
      });

      return {
        query_type: queryType,
        research_results: data.research_data,
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      console.error('Error in Gemini research:', error);
      toast({
        title: "Fel vid web-research",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsResearching(false);
    }
  };

  const getLatestResearch = async (clientId: string): Promise<GeminiResearchData | null> => {
    try {
      const { data, error } = await supabase
        .from('client_data_cache')
        .select('*')
        .eq('client_id', clientId)
        .eq('data_type', 'web_research')
        .eq('source', 'gemini')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching latest research:', error);
        return null;
      }

      if (data && data.length > 0) {
        const cacheItem = data[0];
        // Type guard to ensure proper structure
        if (cacheItem.data && 
            typeof cacheItem.data === 'object' && 
            'query_type' in cacheItem.data &&
            'research_results' in cacheItem.data &&
            'timestamp' in cacheItem.data) {
          return cacheItem.data as unknown as GeminiResearchData;
        }
      }

      return null;
    } catch (error) {
      console.error('Error in getLatestResearch:', error);
      return null;
    }
  };

  return {
    performResearch,
    getLatestResearch,
    isResearching
  };
};