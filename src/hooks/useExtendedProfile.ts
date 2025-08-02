import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ExtendedProfileData } from '@/types/extendedProfile';

export const useExtendedProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const saveExtendedProfile = async (profileData: ExtendedProfileData, targetUserId?: string) => {
    setIsLoading(true);
    try {
      console.log('Saving extended profile data:', profileData);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const userId = targetUserId || userData.user.id;

      // Map the new structure directly to profiles table columns
      const profileUpdate = {
        id: userId,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
        phone: profileData.phone,
        avatar_url: profileData.avatar_url,
        bio: profileData.bio,
        date_of_birth: profileData.date_of_birth === "" ? null : profileData.date_of_birth,
        gender: profileData.gender,
        address: profileData.address,
        location: profileData.location,
        organization: profileData.organization,
        department: profileData.department,
        job_title: profileData.job_title,
        primary_role: profileData.primary_role,
        secondary_role: profileData.secondary_role,
        niche: profileData.niche,
        instagram_handle: profileData.instagram_handle,
        youtube_handle: profileData.youtube_handle,
        tiktok_handle: profileData.tiktok_handle,
        facebook_handle: profileData.facebook_handle,
        twitter_handle: profileData.twitter_handle,
        snapchat_handle: profileData.snapchat_handle,
        primary_contact_name: profileData.primary_contact_name,
        primary_contact_email: profileData.primary_contact_email,
        client_category: profileData.client_category,
        client_status: profileData.client_status,
        tags: profileData.tags,
        platforms: profileData.platforms,
        preferences: profileData.preferences,
        custom_fields: profileData.custom_fields,
        profile_metadata: profileData.profile_metadata,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('profiles')
        .upsert(profileUpdate, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Extended profile saved successfully');

      toast({
        title: "Profil sparad!",
        description: "Din utökade profil har sparats framgångsrikt.",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error saving extended profile:', error);
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

  const getExtendedProfile = async (targetUserId?: string): Promise<ExtendedProfileData | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const userId = targetUserId || userData.user.id;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) return null;

      // Return the flattened structure that maps directly to profiles table
      return {
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        avatar_url: data.avatar_url || '',
        bio: data.bio || '',
        date_of_birth: data.date_of_birth || '',
        gender: data.gender || '',
        address: typeof data.address === 'object' && data.address !== null ? data.address as any : {
          street: '',
          postalCode: '',
          city: '',
          country: ''
        },
        location: data.location || '',
        organization: data.organization || '',
        department: data.department || '',
        job_title: data.job_title || '',
        primary_role: data.primary_role || '',
        secondary_role: data.secondary_role || '',
        niche: data.niche || '',
        instagram_handle: data.instagram_handle || '',
        youtube_handle: data.youtube_handle || '',
        tiktok_handle: data.tiktok_handle || '',
        facebook_handle: data.facebook_handle || '',
        twitter_handle: data.twitter_handle || '',
        snapchat_handle: data.snapchat_handle || '',
        primary_contact_name: data.primary_contact_name || '',
        primary_contact_email: data.primary_contact_email || '',
        client_category: data.client_category || '',
        client_status: data.client_status || 'active',
        tags: Array.isArray(data.tags) ? data.tags as string[] : [],
        platforms: Array.isArray(data.platforms) ? data.platforms as string[] : [],
        preferences: typeof data.preferences === 'object' && data.preferences !== null ? data.preferences as any : {
          notifications: {
            email: true,
            sms: false,
            inApp: true
          },
          allowAiAnalysis: true
        },
        custom_fields: typeof data.custom_fields === 'object' && data.custom_fields !== null ? data.custom_fields as any : {},
        profile_metadata: typeof data.profile_metadata === 'object' && data.profile_metadata !== null ? data.profile_metadata as any : {}
      };
    } catch (error) {
      console.error('Error getting extended profile:', error);
      return null;
    }
  };

  const uploadProfilePicture = async (file: File, targetUserId?: string): Promise<string | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Användare inte inloggad');

      const userId = targetUserId || userData.user.id;
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/profile.${fileExt}`;

      // Ta bort befintlig profilbild först
      await supabase.storage
        .from('profiles')
        .remove([fileName]);

      // Ladda upp ny bild
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Hämta den publika URL:en
      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda upp profilbild: " + error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    saveExtendedProfile,
    getExtendedProfile,
    uploadProfilePicture,
    isLoading
  };
};