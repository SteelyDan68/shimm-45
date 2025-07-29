import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DataCollectionResult {
  success: boolean;
  client_name: string;
  collected_data: {
    news: any[];
    social_metrics: any[];
    web_scraping: any[];
  };
  errors: string[];
}

export const useDataCollector = () => {
  const [isCollecting, setIsCollecting] = useState(false);
  const { toast } = useToast();

  const collectData = async (clientId: string): Promise<DataCollectionResult | null> => {
    setIsCollecting(true);
    
    try {
      console.log('Starting data collection for client:', clientId);
      
      const { data, error } = await supabase.functions.invoke('data-collector', {
        body: { client_id: clientId }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Data collection fel: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Okänt fel vid datainsamling');
      }

      const result = data.result;
      const totalItems = result.collected_data.news.length + 
                        result.collected_data.social_metrics.length + 
                        result.collected_data.web_scraping.length;

      toast({
        title: "Datainsamling klar",
        description: `${totalItems} datapunkter insamlade för ${result.client_name}`,
      });

      if (result.errors.length > 0) {
        console.warn('Collection completed with errors:', result.errors);
        toast({
          title: "Varningar",
          description: `${result.errors.length} fel inträffade under insamlingen`,
          variant: "destructive",
        });
      }

      return result;

    } catch (error: any) {
      console.error('Error in data collection:', error);
      toast({
        title: "Fel vid datainsamling",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsCollecting(false);
    }
  };

  const scheduleCollection = async (clientId: string, intervalHours: number = 24) => {
    // This would integrate with a cron system in production
    // For now, we'll just show a message
    toast({
      title: "Schemaläggning",
      description: `Automatisk datainsamling varje ${intervalHours}h (kommer i nästa version)`,
    });
  };

  return {
    collectData,
    scheduleCollection,
    isCollecting
  };
};