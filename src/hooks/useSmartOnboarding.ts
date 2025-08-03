import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useOnboarding } from '@/hooks/useOnboarding';
import { supabase } from '@/integrations/supabase/client';
import type { OnboardingData } from '@/types/onboarding';

interface SmartOnboardingState {
  isOnboardingRequired: boolean;
  isLoading: boolean;
  userData: Partial<OnboardingData> | null;
  completionPercentage: number;
  missingFields: string[];
  canSkipOnboarding: boolean;
}

export const useSmartOnboarding = () => {
  const { user } = useAuth();
  const { hasCompletedOnboarding, getOnboardingData } = useOnboarding();
  const [state, setState] = useState<SmartOnboardingState>({
    isOnboardingRequired: false,
    isLoading: true,
    userData: null,
    completionPercentage: 0,
    missingFields: [],
    canSkipOnboarding: false
  });

  const checkOnboardingStatus = async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Check if onboarding is completed
      const isCompleted = await hasCompletedOnboarding(user.id);
      
      if (isCompleted) {
        setState(prev => ({
          ...prev,
          isOnboardingRequired: false,
          isLoading: false,
          completionPercentage: 100
        }));
        return;
      }

      // Get existing data to pre-fill form
      const existingData = await getOnboardingData(user.id);
      
      // Calculate completion percentage and missing fields
      const analysis = analyzeCompletionStatus(existingData, user);
      
      setState(prev => ({
        ...prev,
        isOnboardingRequired: true,
        isLoading: false,
        userData: existingData || createInitialDataFromUser(user),
        completionPercentage: analysis.percentage,
        missingFields: analysis.missingFields,
        canSkipOnboarding: analysis.percentage > 30 // Allow skip if 30% completed
      }));

    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isOnboardingRequired: true,
        userData: createInitialDataFromUser(user)
      }));
    }
  };

  const analyzeCompletionStatus = (data: OnboardingData | null, user: any) => {
    const requiredFields = [
      'generalInfo.first_name',
      'generalInfo.last_name', 
      'generalInfo.age',
      'publicRole.primaryRole',
      'publicRole.niche',
      'lifeMap.location',
      'lifeMap.ongoingChanges'
    ];

    const optionalFields = [
      'generalInfo.gender',
      'publicRole.secondaryRole',
      'publicRole.challenges',
      'publicRole.creativeStrengths'
    ];

    let completedRequired = 0;
    let completedOptional = 0;
    const missingFields: string[] = [];

    // Check required fields
    requiredFields.forEach(fieldPath => {
      const value = getNestedValue(data, fieldPath) || getNestedValue(createInitialDataFromUser(user), fieldPath);
      if (value && value.toString().trim()) {
        completedRequired++;
      } else {
        missingFields.push(fieldPath.split('.').pop() || fieldPath);
      }
    });

    // Check optional fields
    optionalFields.forEach(fieldPath => {
      const value = getNestedValue(data, fieldPath);
      if (value && value.toString().trim()) {
        completedOptional++;
      }
    });

    const totalRequired = requiredFields.length;
    const totalOptional = optionalFields.length;
    
    // Weight required fields more heavily (80% of score)
    const requiredScore = (completedRequired / totalRequired) * 0.8;
    const optionalScore = (completedOptional / totalOptional) * 0.2;
    const percentage = Math.round((requiredScore + optionalScore) * 100);

    return {
      percentage,
      missingFields,
      completedRequired,
      totalRequired
    };
  };

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const createInitialDataFromUser = (user: any): Partial<OnboardingData> => {
    const email = user.email || '';
    const metadata = user.user_metadata || {};
    
    return {
      generalInfo: {
        name: metadata.full_name || email.split('@')[0] || '',
        first_name: metadata.first_name || '',
        last_name: metadata.last_name || '',
        age: '',
        gender: '',
        height: '',
        weight: '',
        physicalLimitations: '',
        neurodiversity: ''
      },
      publicRole: {
        primaryRole: '',
        secondaryRole: '',
        niche: '',
        creativeStrengths: '',
        platforms: [],
        challenges: '',
        instagramHandle: '',
        youtubeHandle: '',
        tiktokHandle: '',
        snapchatHandle: '',
        facebookHandle: '',
        twitterHandle: ''
      },
      lifeMap: {
        location: '',
        livingWith: '',
        hasChildren: '',
        ongoingChanges: '',
        pastCrises: ''
      }
    };
  };

  const getOnboardingRecommendation = () => {
    if (state.completionPercentage === 0) {
      return {
        title: "Låt oss komma igång!",
        description: "Det tar bara 2 minuter att skapa din personliga utvecklingsprofil.",
        priority: "high" as const
      };
    } else if (state.completionPercentage < 50) {
      return {
        title: "Slutför din profil",
        description: `Du har fyllt i ${state.completionPercentage}% av din profil. Slutför för bättre rekommendationer.`,
        priority: "medium" as const
      };
    } else if (state.completionPercentage < 100) {
      return {
        title: "Förbättra din profil",
        description: `Din profil är ${state.completionPercentage}% klar. Lägg till mer info för ännu bättre coaching.`,
        priority: "low" as const
      };
    }
    
    return null;
  };

  useEffect(() => {
    if (user) {
      checkOnboardingStatus();
    }
  }, [user]);

  return {
    ...state,
    refreshStatus: checkOnboardingStatus,
    recommendation: getOnboardingRecommendation()
  };
};