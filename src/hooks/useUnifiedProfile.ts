/**
 * 🔄 UNIFIED PROFILE MANAGEMENT HOOK
 * 
 * Central hook för all profildata-hantering
 * Ersätter alla fragmenterade profil-hooks
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  UnifiedProfileData, 
  mapToDatabase, 
  mapFromDatabase,
  validateProfile,
  calculateAge
} from '@/types/unifiedProfile';

export const useUnifiedProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // === FETCH PROFILE DATA ===
  const getProfile = useCallback(async (userId?: string): Promise<UnifiedProfileData | null> => {
    setIsLoading(true);
    try {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      
      if (!targetUserId) {
        throw new Error('Ingen användare-ID tillgänglig');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      // Map database data to unified structure
      const { mapFromDatabase } = await import('@/types/unifiedProfile');
      const unifiedData = mapFromDatabase(data);
      
      // Calculate age if date_of_birth exists
      if (unifiedData.date_of_birth) {
        const { calculateAge } = await import('@/types/unifiedProfile');
        unifiedData.age = calculateAge(unifiedData.date_of_birth);
      }

      return unifiedData;

    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda profildata",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // === SAVE PROFILE DATA ===
  const saveProfile = useCallback(async (
    profileData: UnifiedProfileData, 
    userId?: string
  ): Promise<{ success: boolean; data?: UnifiedProfileData }> => {
    setIsSaving(true);
    try {
      // Validate profile data
      const { validateProfile } = await import('@/types/unifiedProfile');
      const validation = validateProfile(profileData);
      
      if (!validation.isValid) {
        toast({
          title: "Valideringsfel",
          description: validation.errors.join(', '),
          variant: "destructive"
        });
        return { success: false };
      }

      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      
      if (!targetUserId) {
        throw new Error('Ingen användare-ID tillgänglig');
      }

      // Calculate age from date_of_birth
      if (profileData.date_of_birth) {
        const { calculateAge } = await import('@/types/unifiedProfile');
        profileData.age = calculateAge(profileData.date_of_birth);
      }

      // Map to database structure
      const { mapToDatabase } = await import('@/types/unifiedProfile');
      const dbData = mapToDatabase(profileData);

      const { data, error } = await supabase
        .from('profiles')
        .update(dbData)
        .eq('id', targetUserId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Profil sparad",
        description: "Din profil har uppdaterats framgångsrikt",
      });

      // Return updated data in unified format
      const { mapFromDatabase } = await import('@/types/unifiedProfile');
      return { 
        success: true, 
        data: mapFromDatabase(data) 
      };

    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara profilen",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setIsSaving(false);
    }
  }, [toast]);

  // === UPLOAD PROFILE PICTURE ===
  const uploadProfilePicture = useCallback(async (file: File, userId?: string): Promise<string | null> => {
    try {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      
      if (!targetUserId) {
        throw new Error('Ingen användare-ID tillgänglig');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${targetUserId}-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', targetUserId);

      toast({
        title: "Profilbild uppladdad",
        description: "Din profilbild har uppdaterats",
      });

      return publicUrl;

    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda upp profilbilden",
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);

  // === CREATE INITIAL PROFILE ===
  const createProfile = useCallback(async (
    initialData: Partial<UnifiedProfileData>, 
    userId: string
  ): Promise<{ success: boolean }> => {
    setIsSaving(true);
    try {
      const { mapToDatabase } = await import('@/types/unifiedProfile');
      
      // Create minimal profile with required fields
      const defaultProfile: UnifiedProfileData = {
        first_name: initialData.first_name || '',
        last_name: initialData.last_name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        date_of_birth: initialData.date_of_birth || '',
        gender: initialData.gender || 'vill_inte_ange',
        address: initialData.address || {
          street: '',
          postal_code: '',
          city: '',
          country: 'Sverige'
        },
        social_media: initialData.social_media || {
          instagram: '',
          youtube: '',
          tiktok: '',
          facebook: '',
          twitter: '',
          snapchat: '',
          website: ''
        },
        professional: initialData.professional || {
          job_title: '',
          organization: '',
          department: '',
          primary_role: '',
          niche: '',
          industry: ''
        },
        notes: initialData.notes || '',
        gdpr_consent: initialData.gdpr_consent || false,
        data_processing_consent: initialData.data_processing_consent || false,
        marketing_consent: initialData.marketing_consent || false,
        ...initialData
      };

      const dbData = mapToDatabase(defaultProfile);

      const { error } = await supabase
        .from('profiles')
        .insert({ id: userId, ...dbData });

      if (error) {
        throw error;
      }

      return { success: true };

    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa profilen",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setIsSaving(false);
    }
  }, [toast]);

  // === CHECK PROFILE COMPLETENESS ===
  const checkProfileCompleteness = useCallback(async (userId?: string): Promise<{
    isComplete: boolean;
    missingFields: string[];
    completionPercentage: number;
  }> => {
    try {
      const profile = await getProfile(userId);
      
      if (!profile) {
        return {
          isComplete: false,
          missingFields: ['Profil saknas helt'],
          completionPercentage: 0
        };
      }

      const { validateProfile, PROFILE_VALIDATION } = await import('@/types/unifiedProfile');
      const validation = validateProfile(profile);

      // Calculate completion percentage
      const totalFields = Object.keys(profile).length;
      const filledFields = Object.values(profile).filter(value => {
        if (typeof value === 'string') return value.trim() !== '';
        if (typeof value === 'object' && value !== null) {
          return Object.values(value).some(v => v !== '' && v !== null && v !== undefined);
        }
        return value !== null && value !== undefined;
      }).length;

      const completionPercentage = Math.round((filledFields / totalFields) * 100);

      return {
        isComplete: validation.isValid,
        missingFields: validation.errors,
        completionPercentage
      };

    } catch (error) {
      console.error('Error checking profile completeness:', error);
      return {
        isComplete: false,
        missingFields: ['Kunde inte kontrollera profil'],
        completionPercentage: 0
      };
    }
  }, [getProfile]);

  return {
    // State
    isLoading,
    isSaving,
    
    // Actions
    getProfile,
    saveProfile,
    uploadProfilePicture,
    createProfile,
    checkProfileCompleteness
  };
};