import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ExtendedProfileData } from '@/types/extendedProfile';

export const useExtendedProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const saveExtendedProfile = async (profileData: ExtendedProfileData) => {
    setIsLoading(true);
    try {
      console.log('Saving extended profile data:', profileData);
      
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: (await supabase.auth.getUser()).data.user?.id,
          email: profileData.contactInfo.email,
          first_name: profileData.basicInfo.fullName.split(' ')[0],
          last_name: profileData.basicInfo.fullName.split(' ').slice(1).join(' ') || '',
          phone: profileData.contactInfo.phone,
          avatar_url: profileData.basicInfo.profilePicture,
          bio: profileData.basicInfo.bio,
          profile_extended: JSON.parse(JSON.stringify(profileData))
        }, {
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

  const getExtendedProfile = async (): Promise<ExtendedProfileData | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) return null;

      // Om profile_extended finns, använd den, annars skapa från befintlig data
      if (data.profile_extended && Object.keys(data.profile_extended as any).length > 0) {
        return data.profile_extended as unknown as ExtendedProfileData;
      }

      // Skapa grundläggande struktur från befintlig profildata
      return {
        basicInfo: {
          fullName: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          bio: data.bio || '',
          profilePicture: data.avatar_url || '',
        },
        contactInfo: {
          email: data.email || '',
          phone: data.phone || '',
        },
        digitalPresence: {},
        workProfile: {
          activePlatforms: []
        },
        systemSettings: {
          notificationPreferences: {
            email: true,
            sms: false,
            inApp: true
          },
          allowAiAnalysis: true
        }
      };
    } catch (error) {
      console.error('Error getting extended profile:', error);
      return null;
    }
  };

  const uploadProfilePicture = async (file: File): Promise<string | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Användare inte inloggad');

      const fileExt = file.name.split('.').pop();
      const fileName = `${userData.user.id}/profile.${fileExt}`;

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