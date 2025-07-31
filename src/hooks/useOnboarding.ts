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
      console.log('Saving onboarding data:', { clientId, data });
      
      // Skapa en strukturerad profile_metadata med nested properties
      const profileMetadata = {
        generalInfo: data.generalInfo,
        publicRole: data.publicRole,
        lifeMap: data.lifeMap,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update({ 
          preferences: profileMetadata,
          // Update name from onboarding data
          first_name: data.generalInfo.name?.split(' ')[0] || undefined,
          last_name: data.generalInfo.name?.split(' ').slice(1).join(' ') || undefined,
          // Store social media links in social_links JSON field
          social_links: {
            instagram: data.publicRole.instagramHandle || null,
            youtube: data.publicRole.youtubeHandle || null,
            tiktok: data.publicRole.tiktokHandle || null
          }
        })
        .eq('id', clientId);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Onboarding data saved successfully');

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
        .from('profiles')
        .select('preferences') // Use preferences instead of profile_metadata
        .eq('id', clientId)
        .single();

      if (error) throw error;

      return (data?.preferences as unknown as OnboardingData) || null;
    } catch (error) {
      console.error('Error getting onboarding data:', error);
      return null;
    }
  };

  const hasCompletedOnboarding = async (clientId: string): Promise<boolean> => {
    const data = await getOnboardingData(clientId);
    // Förbättrad kontroll - kolla både på flagga och på att alla nödvändiga fält finns
    return !!(data?.onboardingCompleted || (data?.generalInfo?.name && data?.publicRole?.primaryRole && data?.lifeMap?.location));
  };

  return {
    saveOnboardingData,
    getOnboardingData,
    hasCompletedOnboarding,
    isLoading
  };
};