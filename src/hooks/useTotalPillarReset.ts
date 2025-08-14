/**
 * 🔄 TOTAL PILLAR RESET HOOK
 * 
 * Hook för komplett systemrengöring av ALL användardata
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useTotalPillarReset = (userId?: string) => {
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();

  const resetAllPillars = async (userIdParam?: string): Promise<void> => {
    const actualUserId = userIdParam || userId;
    if (!actualUserId) {
      throw new Error('User ID is required for total reset');
    }

    setIsResetting(true);
    console.log(`🔄 Starting TOTAL RESET for user: ${actualUserId}`);

    try {
      // Call the total reset edge function
      const { data, error } = await supabase.functions.invoke('total-pillar-reset', {
        body: { 
          userId: actualUserId
        }
      });

      if (error) {
        console.error('Total reset error:', error);
        throw error;
      }

      console.log('✅ Total reset completed:', data);

      toast({
        title: "🔄 KOMPLETT SYSTEMRESET GENOMFÖRD",
        description: "All utvecklingsdata har raderats. Du kan nu börja om från början med dina pillars.",
        variant: "default",
      });

      // CRITICAL: Also clear assessment_rounds that dashboard uses
      const { error: assessmentError } = await supabase
        .from('assessment_rounds')
        .delete()
        .eq('user_id', actualUserId);

      if (assessmentError) {
        console.error('Assessment rounds total cleanup error:', assessmentError);
        // Continue anyway, edge function should have handled this
      }

      console.log('✅ Assessment rounds completely cleared');

      // Force complete page reload to reset all state
      setTimeout(() => {
        window.location.href = '/client-dashboard';
      }, 2000);

    } catch (error: any) {
      console.error('Error during total reset:', error);
      
      toast({
        title: "❌ Fel vid total återställning",
        description: error.message || "Kunde inte återställa systemet. Försök igen.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsResetting(false);
    }
  };

  return {
    resetAllPillars,
    isResetting
  };
};