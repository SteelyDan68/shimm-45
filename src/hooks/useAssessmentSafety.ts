import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AssessmentState {
  id?: string;
  user_id: string;
  assessment_type: string;
  assessment_key: string;
  current_step: string;
  form_data: Record<string, any>;
  metadata: Record<string, any>;
  is_draft: boolean;
  version: number;
  auto_save_count: number;
  last_saved_at: string;
  device_info: Record<string, any>;
}

export interface AssessmentSafetyOptions {
  autoSaveInterval?: number; // milliseconds
  conflictResolution?: 'overwrite' | 'merge' | 'new_version';
  enableRecovery?: boolean;
  trackDeviceInfo?: boolean;
}

/**
 * ASSESSMENT SAFETY HOOK - Robust state management med auto-save och recovery
 * Förhindrar dataförlust och hanterar conflicfts intelligent
 */
export const useAssessmentSafety = (
  assessmentType: string,
  assessmentKey: string,
  options: AssessmentSafetyOptions = {}
) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const {
    autoSaveInterval = 30000, // 30 sekunder
    conflictResolution = 'new_version',
    enableRecovery = true,
    trackDeviceInfo = true
  } = options;

  const [assessmentState, setAssessmentState] = useState<AssessmentState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [recoveredData, setRecoveredData] = useState<any>(null);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveDataRef = useRef<string>('');

  // Device fingerprinting för conflict detection
  const getDeviceInfo = useCallback(() => {
    if (!trackDeviceInfo) return {};
    
    return {
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      screen_resolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };
  }, [trackDeviceInfo]);

  // Ladda eller återställ assessment state
  const loadAssessmentState = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Försök först hitta existerande draft
      const { data: existingState, error } = await supabase
        .from('assessment_states')
        .select('*')
        .eq('user_id', user.id)
        .eq('assessment_key', assessmentKey)
        .eq('is_draft', true)
        .order('last_saved_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (existingState) {
        setAssessmentState(existingState);
        lastSaveDataRef.current = JSON.stringify(existingState.form_data);
        
        // Visa recovery notification om data är gammal
        const lastSaved = new Date(existingState.last_saved_at);
        const hoursSinceLastSave = (Date.now() - lastSaved.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastSave > 1) {
          toast({
            title: "Tidigare data återställd",
            description: `Din senaste session från ${lastSaved.toLocaleString('sv-SE')} har återställts.`,
            variant: "default"
          });
          setRecoveredData(existingState.form_data);
        }
      } else if (enableRecovery) {
        // Försök återställa från recovery function
        const { data: recoveryData } = await supabase.rpc('recover_assessment_draft', {
          p_user_id: user.id,
          p_assessment_key: assessmentKey
        });

        if (recoveryData?.recovered) {
          setRecoveredData(recoveryData.form_data);
          toast({
            title: "Data återställd",
            description: "Vi hittade tidigare osparad data som har återställts.",
            variant: "default"
          });
        }
      }
    } catch (error) {
      console.error('Error loading assessment state:', error);
      toast({
        title: "Fel vid laddning",
        description: "Kunde inte ladda tidigare data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, assessmentKey, enableRecovery, toast]);

  // Auto-save funktion
  const performAutoSave = useCallback(async (formData: Record<string, any>, currentStep: string) => {
    if (!user || !formData) return;

    // Kontrollera om data faktiskt har ändrats
    const currentDataString = JSON.stringify(formData);
    if (currentDataString === lastSaveDataRef.current) {
      return;
    }

    try {
      const saveData = {
        user_id: user.id,
        assessment_type: assessmentType,
        assessment_key: assessmentKey,
        current_step: currentStep,
        form_data: formData,
        metadata: {
          auto_save: true,
          save_timestamp: new Date().toISOString(),
          conflict_resolution: conflictResolution
        },
        is_draft: true,
        device_info: getDeviceInfo(),
        auto_saved_at: new Date().toISOString()
      };

      if (assessmentState?.id) {
        // Uppdatera befintlig
        const { data, error } = await supabase
          .from('assessment_states')
          .update({
            ...saveData,
            version: (assessmentState.version || 1) + 1,
            auto_save_count: (assessmentState.auto_save_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', assessmentState.id)
          .select()
          .single();

        if (error) throw error;
        
        setAssessmentState(data);
      } else {
        // Skapa ny
        const { data, error } = await supabase
          .from('assessment_states')
          .insert(saveData)
          .select()
          .single();

        if (error) throw error;
        
        setAssessmentState(data);
      }

      lastSaveDataRef.current = currentDataString;
      setLastAutoSave(new Date());
      setHasUnsavedChanges(false);

      console.log('📱 Auto-save completed successfully');
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Visa inte toast för auto-save failures för att inte störa användaren
    }
  }, [user, assessmentType, assessmentKey, conflictResolution, assessmentState, getDeviceInfo]);

  // Manuell save funktion
  const saveAssessmentState = useCallback(async (
    formData: Record<string, any>, 
    currentStep: string,
    isDraft: boolean = true
  ) => {
    if (!user) return null;

    try {
      const saveData = {
        user_id: user.id,
        assessment_type: assessmentType,
        assessment_key: assessmentKey,
        current_step: currentStep,
        form_data: formData,
        metadata: {
          manual_save: true,
          save_timestamp: new Date().toISOString(),
          conflict_resolution: conflictResolution
        },
        is_draft: isDraft,
        device_info: getDeviceInfo()
      };

      if (assessmentState?.id) {
        const { data, error } = await supabase
          .from('assessment_states')
          .update({
            ...saveData,
            version: (assessmentState.version || 1) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', assessmentState.id)
          .select()
          .single();

        if (error) throw error;
        
        setAssessmentState(data);
        toast({
          title: "Sparat",
          description: "Dina svar har sparats säkert.",
          variant: "default"
        });
        
        return data;
      } else {
        const { data, error } = await supabase
          .from('assessment_states')
          .insert(saveData)
          .select()
          .single();

        if (error) throw error;
        
        setAssessmentState(data);
        toast({
          title: "Sparat",
          description: "Dina svar har sparats säkert.",
          variant: "default"
        });
        
        return data;
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: "Sparning misslyckades",
        description: "Kunde inte spara dina svar. Försök igen.",
        variant: "destructive"
      });
      throw error;
    }
  }, [user, assessmentType, assessmentKey, conflictResolution, assessmentState, getDeviceInfo, toast]);

  // Radera draft
  const clearDraft = useCallback(async () => {
    if (!assessmentState?.id) return;

    try {
      const { error } = await supabase
        .from('assessment_states')
        .delete()
        .eq('id', assessmentState.id);

      if (error) throw error;

      setAssessmentState(null);
      setHasUnsavedChanges(false);
      setRecoveredData(null);
      lastSaveDataRef.current = '';
      
      toast({
        title: "Draft raderad",
        description: "Alla sparade data har raderats.",
        variant: "default"
      });
    } catch (error) {
      console.error('Clear draft failed:', error);
      toast({
        title: "Fel",
        description: "Kunde inte radera draft.",
        variant: "destructive"
      });
    }
  }, [assessmentState, toast]);

  // Data change tracking
  const trackDataChange = useCallback((newData: Record<string, any>) => {
    const currentDataString = JSON.stringify(newData);
    if (currentDataString !== lastSaveDataRef.current) {
      setHasUnsavedChanges(true);
    }
  }, []);

  // Setup auto-save timer
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Start auto-save för specifik data
  const startAutoSave = useCallback((formData: Record<string, any>, currentStep: string) => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setInterval(() => {
      if (hasUnsavedChanges) {
        performAutoSave(formData, currentStep);
      }
    }, autoSaveInterval);
  }, [hasUnsavedChanges, performAutoSave, autoSaveInterval]);

  // Stop auto-save
  const stopAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);

  // Browser navigation guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Initial load
  useEffect(() => {
    loadAssessmentState();
  }, [loadAssessmentState]);

  return {
    // State
    assessmentState,
    isLoading,
    hasUnsavedChanges,
    lastAutoSave,
    recoveredData,
    
    // Actions
    saveAssessmentState,
    clearDraft,
    trackDataChange,
    startAutoSave,
    stopAutoSave,
    loadAssessmentState,
    
    // Utils
    setHasUnsavedChanges,
    setRecoveredData
  };
};