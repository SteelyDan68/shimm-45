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
    console.log(`🔄 Starting TOTAL RETAKE for pillar: ${pillarKey}`);

    try {
      // STEP 1: Call enhanced cleanup function for single pillar
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

      console.log('✅ Single pillar cleanup completed:', data);

      // STEP 2: CRITICAL - Also delete from assessment_rounds (dashboard data source)
      const { error: assessmentError } = await supabase
        .from('assessment_rounds')
        .delete()
        .eq('user_id', userId)
        .eq('pillar_type', pillarKey);

      if (assessmentError) {
        console.error('Assessment rounds cleanup error:', assessmentError);
        throw assessmentError;
      }

      console.log('✅ Assessment rounds cleaned for:', pillarKey);

      // STEP 3: Clear any cached UI state
      await refetch();

      // STEP 4: Force UI refresh to show reset state immediately
      setTimeout(() => {
        window.location.reload();
      }, 1000);

      toast({
        title: "🔄 KOMPLETT PILLAR-RESET GENOMFÖRD",
        description: `${pillarKey} är nu fullständigt nollställd. Alla data, analyser och bedömningar har raderats. Du kan börja om från början.`,
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