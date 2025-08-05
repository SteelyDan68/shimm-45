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
      
      
      // Skapa en strukturerad profile_metadata med nested properties för backup
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
          // Store structured data in preferences as backup
          preferences: profileMetadata,
          
          // General info in dedicated columns
          first_name: data.generalInfo.first_name || data.generalInfo.name?.split(' ')[0] || undefined,
          last_name: data.generalInfo.last_name || data.generalInfo.name?.split(' ').slice(1).join(' ') || undefined,
          age: data.generalInfo.age ? parseInt(data.generalInfo.age) : null,
          gender: data.generalInfo.gender || null,
          height: data.generalInfo.height || null,
          weight: data.generalInfo.weight || null,
          physical_limitations: data.generalInfo.physicalLimitations || null,
          neurodiversity: data.generalInfo.neurodiversity || null,
          
          // Public role in dedicated columns
          primary_role: data.publicRole.primaryRole || null,
          secondary_role: data.publicRole.secondaryRole || null,
          niche: data.publicRole.niche || null,
          creative_strengths: data.publicRole.creativeStrengths || null,
          platforms: data.publicRole.platforms || [],
          challenges: data.publicRole.challenges || null,
          
          // Social media handles in dedicated columns
          instagram_handle: data.publicRole.instagramHandle || null,
          youtube_handle: data.publicRole.youtubeHandle || null,
          tiktok_handle: data.publicRole.tiktokHandle || null,
          snapchat_handle: data.publicRole.snapchatHandle || null,
          facebook_handle: data.publicRole.facebookHandle || null,
          twitter_handle: data.publicRole.twitterHandle || null,
          
          // Life map in dedicated columns
          location: data.lifeMap.location || null,
          living_with: data.lifeMap.livingWith || null,
          has_children: data.lifeMap.hasChildren || null,
          ongoing_changes: data.lifeMap.ongoingChanges || null,
          past_crises: data.lifeMap.pastCrises || null,
          
          // Onboarding tracking
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      

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
        .select(`
          first_name, last_name, age, gender, height, weight, physical_limitations, neurodiversity,
          primary_role, secondary_role, niche, creative_strengths, platforms, challenges,
          instagram_handle, youtube_handle, tiktok_handle, snapchat_handle, facebook_handle, twitter_handle,
          location, living_with, has_children, ongoing_changes, past_crises,
          onboarding_completed, onboarding_completed_at
        `)
        .eq('id', clientId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Convert database columns back to OnboardingData format
      const onboardingData: OnboardingData = {
        generalInfo: {
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          age: data.age?.toString() || '',
          gender: data.gender || '',
          height: data.height || '',
          weight: data.weight || '',
          physicalLimitations: data.physical_limitations || '',
          neurodiversity: data.neurodiversity || ''
        },
        publicRole: {
          primaryRole: data.primary_role || '',
          secondaryRole: data.secondary_role || '',
          niche: data.niche || '',
          creativeStrengths: data.creative_strengths || '',
          platforms: Array.isArray(data.platforms) ? data.platforms.filter((p): p is string => typeof p === 'string') : [],
          challenges: data.challenges || '',
          instagramHandle: data.instagram_handle || '',
          youtubeHandle: data.youtube_handle || '',
          tiktokHandle: data.tiktok_handle || '',
          snapchatHandle: data.snapchat_handle || '',
          facebookHandle: data.facebook_handle || '',
          twitterHandle: data.twitter_handle || ''
        },
        lifeMap: {
          location: data.location || '',
          livingWith: data.living_with || '',
          hasChildren: data.has_children || '',
          ongoingChanges: data.ongoing_changes || '',
          pastCrises: data.past_crises || ''
        },
        onboardingCompleted: data.onboarding_completed || false,
        onboardingCompletedAt: data.onboarding_completed_at || undefined
      };

      return onboardingData;
    } catch (error) {
      console.error('Error getting onboarding data:', error);
      return null;
    }
  };

  const hasCompletedOnboarding = async (clientId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed, first_name, primary_role, location')
        .eq('id', clientId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return false;

      // Check onboarding_completed flag or presence of required fields
      return !!(data.onboarding_completed || (data.first_name && data.primary_role && data.location));
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  };

  return {
    saveOnboardingData,
    getOnboardingData,
    hasCompletedOnboarding,
    isLoading
  };
};