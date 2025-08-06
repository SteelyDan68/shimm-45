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

    try {
      // Call the clear-pillar-dependencies edge function
      const { error } = await supabase.functions.invoke('clear-pillar-dependencies', {
        body: { 
          userId, 
          pillarKey 
        }
      });

      if (error) {
        throw error;
      }

      // Refresh pillar data to trigger UI updates
      await refetch();

      toast({
        title: "✅ Pillar återställd",
        description: `${pillarKey} har återställts och är redo för ny bedömning.`,
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