import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { OnboardingData } from '@/types/onboarding';

export const useOnboarding = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const saveOnboardingData = async (clientId: string, data: OnboardingData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({ 
          profile_metadata: data as any,
          // Uppdatera också namn från onboarding data
          name: data.generalInfo.name || undefined
        })
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: "Profil sparad!",
        description: "Din information har sparats. Nu går vi vidare till självskattningen.",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error saving onboarding data:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara din profil: " + error.message,
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  const getOnboardingData = async (clientId: string): Promise<OnboardingData | null> => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('profile_metadata')
        .eq('id', clientId)
        .single();

      if (error) throw error;

      return (data?.profile_metadata as unknown as OnboardingData) || null;
    } catch (error) {
      console.error('Error getting onboarding data:', error);
      return null;
    }
  };

  const hasCompletedOnboarding = async (clientId: string): Promise<boolean> => {
    const data = await getOnboardingData(clientId);
    return !!(data?.generalInfo?.name && data?.publicRole?.primaryRole && data?.lifeMap?.location);
  };

  return {
    saveOnboardingData,
    getOnboardingData,
    hasCompletedOnboarding,
    isLoading
  };
};