import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface LogicState {
  velocity_rank: string;
  recommendation: string;
  tone: string;
  last_updated: string;
  metrics?: {
    followerGrowth: number;
    engagementRate: number;
    postFrequency: number;
    recentActivity: number;
  };
}

export const useClientLogic = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processClientLogic = async (clientId: string): Promise<LogicState | null> => {
    setIsProcessing(true);
    
    try {
      console.log('Processing client logic for:', clientId);
      
      const { data, error } = await supabase.functions.invoke('client-logic', {
        body: { client_id: clientId }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Fel vid analys: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Okänt fel vid analys');
      }

      toast({
        title: "Analys klar",
        description: `Velocity rank: ${data.logic_state.velocity_rank}`,
      });

      return data.logic_state;

    } catch (error: any) {
      console.error('Error processing client logic:', error);
      toast({
        title: "Fel vid analys",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const getClientLogicState = async (clientId: string): Promise<LogicState | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferences') // Store logic state in preferences
        .eq('id', clientId)
        .single();

      if (error) {
        console.error('Error fetching logic state:', error);
        return null;
      }

      // Ensure the logic_state is properly typed
      const logicState = (data.preferences as any)?.logic_state;
      if (logicState &&
          typeof logicState === 'object' && 
          'velocity_rank' in logicState && 
          'recommendation' in logicState && 
          'tone' in logicState &&
          'last_updated' in logicState) {
        return logicState as unknown as LogicState;
      }

      return null;
    } catch (error) {
      console.error('Error getting client logic state:', error);
      return null;
    }
  };

  return {
    processClientLogic,
    getClientLogicState,
    isProcessing
  };
};