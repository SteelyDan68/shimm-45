import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAIPlanning = (clientId?: string) => {
  const [lastRecommendation, setLastRecommendation] = useState<any>(null);
  const [showPlanningDialog, setShowPlanningDialog] = useState(false);
  const { toast } = useToast();

  // Listen for new recommendations
  useEffect(() => {
    if (!clientId) return;

    const checkForNewRecommendations = async () => {
      try {
        const { data, error } = await supabase
          .from('path_entries')
          .select('*')
          .eq('client_id', clientId)
          .eq('type', 'recommendation')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error checking recommendations:', error);
          return;
        }

        if (data && data.length > 0) {
          const recommendation = data[0];
          
          // Check if this is a new recommendation (created in last 10 seconds)
          const createdAt = new Date(recommendation.created_at);
          const now = new Date();
          const timeDiff = now.getTime() - createdAt.getTime();
          
          if (timeDiff < 10000) { // 10 seconds
            setLastRecommendation(recommendation);
            
            // Show planning dialog after a short delay
            setTimeout(() => {
              setShowPlanningDialog(true);
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Error in checkForNewRecommendations:', error);
      }
    };

    // Check immediately
    checkForNewRecommendations();

    // Set up real-time subscription for new recommendations
    const subscription = supabase
      .channel('recommendations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'path_entries',
          filter: `client_id=eq.${clientId} AND type=eq.recommendation`
        },
        (payload) => {
          console.log('New recommendation received:', payload.new);
          setLastRecommendation(payload.new);
          
          // Show planning dialog after a short delay
          setTimeout(() => {
            setShowPlanningDialog(true);
          }, 2000);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [clientId]);

  const dismissPlanningDialog = () => {
    setShowPlanningDialog(false);
    setLastRecommendation(null);
  };

  const handlePlanCreated = () => {
    toast({
      title: "AI-plan skapad",
      description: "En strukturerad utvecklingsplan har lagts till i kalendern.",
    });
    
    // Refresh calendar or emit event for other components to update
    window.dispatchEvent(new CustomEvent('calendar-updated'));
  };

  return {
    lastRecommendation,
    showPlanningDialog,
    dismissPlanningDialog,
    handlePlanCreated
  };
};