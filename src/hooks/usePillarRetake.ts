/**
 * 🔄 PILLAR RETAKE HOOK
 * 
 * Hanterar retake-funktionalitet med visuell återställning
 * Säkerställer dependency integrity och visuell feedback
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUserPillars } from '@/hooks/useUserPillars';
import { supabase } from '@/integrations/supabase/client';
import { PillarKey } from '@/types/sixPillarsModular';

export const usePillarRetake = (userId?: string) => {
  const [isRetaking, setIsRetaking] = useState(false);
  const { toast } = useToast();
  const { refetch } = useUserPillars(userId || '');

  const retakePillar = async (pillarKey: PillarKey): Promise<void> => {
    if (!userId) {
      throw new Error('User ID is required for pillar retake');
    }

    setIsRetaking(true);
    console.log(`🔄 Starting retake for pillar: ${pillarKey}`);

    try {
      // Call the enhanced clear-pillar-dependencies edge function
      const { data, error } = await supabase.functions.invoke('clear-pillar-dependencies', {
        body: { 
          userId, 
          pillarKey 
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('✅ Retake cleanup completed:', data);

      // Refresh pillar data to trigger UI updates
      await refetch();

      // Show success message with cleanup details
      const cleanupSummary = data?.cleanup_summary?.[0];
      toast({
        title: "✅ Pillar fullständigt återställd",
        description: `${pillarKey} och alla relaterade data har rensats. ${cleanupSummary?.message || 'Systemintegritet säkerställd.'} Redo för ny bedömning.`,
        variant: "default",
      });

    } catch (error: any) {
      console.error('Error during pillar retake:', error);
      
      toast({
        title: "❌ Fel vid återställning",
        description: error.message || "Kunde inte återställa pillaren. Försök igen.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsRetaking(false);
    }
  };

  return {
    retakePillar,
    isRetaking
  };
};