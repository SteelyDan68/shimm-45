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

export interface AssessmentSafetyConfig {
  isActive: boolean;
  hasUnsavedChanges: boolean;
  assessmentType: string;
  assessmentKey?: string;
  currentStep: string;
  formData: Record<string, any>;
  onStateRestore?: (data: any) => void;
  preventAccidentalSubmission?: boolean;
  autoSaveInterval?: number;
  onBeforeExit?: () => void;
}

export interface AssessmentSafetyOptions {
  autoSaveInterval?: number;
  conflictResolution?: 'overwrite' | 'merge' | 'new_version';
  enableRecovery?: boolean;
  trackDeviceInfo?: boolean;
}

/**
 * ASSESSMENT SAFETY HOOK - Robust state management with auto-save and recovery
 */
export const useAssessmentSafety = (
  config: AssessmentSafetyConfig | string,
  assessmentKey?: string,
  options: AssessmentSafetyOptions = {}
) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Support both old and new signature
  const isOldSignature = typeof config === 'string';
  const assessmentType = isOldSignature ? config : config.assessmentType;
  const actualAssessmentKey = isOldSignature ? assessmentKey! : config.assessmentKey || '';
  const formData = isOldSignature ? {} : config.formData;
  const currentStep = isOldSignature ? '1' : config.currentStep;
  
  const {
    autoSaveInterval = isOldSignature ? options.autoSaveInterval || 30000 : config.autoSaveInterval || 30000,
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

  // Helper to convert database form_data to Record<string, any>
  const convertFormData = (data: any): Record<string, any> => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return {};
      }
    }
    return data || {};
  };

  // Helper to convert database record to AssessmentState
  const convertToAssessmentState = (dbRecord: any): AssessmentState => {
    return {
      ...dbRecord,
      form_data: convertFormData(dbRecord.form_data),
      metadata: convertFormData(dbRecord.metadata),
      device_info: convertFormData(dbRecord.device_info)
    };
  };

  // Device fingerprinting
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

  // Load assessment state
  const loadAssessmentState = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data: existingState, error } = await supabase
        .from('assessment_states')
        .select('*')
        .eq('user_id', user.id)
        .eq('assessment_key', actualAssessmentKey)
        .eq('is_draft', true)
        .order('last_saved_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (existingState) {
        const state = convertToAssessmentState(existingState);
        setAssessmentState(state);
        lastSaveDataRef.current = JSON.stringify(state.form_data);
        
        const lastSaved = new Date(state.last_saved_at);
        const hoursSinceLastSave = (Date.now() - lastSaved.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastSave > 1) {
          toast({
            title: "Tidigare data återställd",
            description: `Din senaste session från ${lastSaved.toLocaleString('sv-SE')} har återställts.`,
            variant: "default"
          });
          setRecoveredData(state.form_data);
        }
      } else if (enableRecovery) {
        const { data: recoveryData } = await supabase.rpc('recover_assessment_draft', {
          p_user_id: user.id,
          p_assessment_key: actualAssessmentKey
        });

        if (recoveryData && typeof recoveryData === 'object' && 'recovered' in recoveryData && recoveryData.recovered) {
          const formData = convertFormData((recoveryData as any).form_data);
          setRecoveredData(formData);
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
  }, [user, actualAssessmentKey, enableRecovery, toast]);

  // Auto-save function
  const performAutoSave = useCallback(async (formData: Record<string, any>, currentStep: string) => {
    if (!user || !formData) return;

    const currentDataString = JSON.stringify(formData);
    if (currentDataString === lastSaveDataRef.current) {
      return;
    }

    try {
      const saveData = {
        user_id: user.id,
        assessment_type: assessmentType,
        assessment_key: actualAssessmentKey,
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
        setAssessmentState(convertToAssessmentState(data));
      } else {
        const { data, error } = await supabase
          .from('assessment_states')
          .insert(saveData)
          .select()
          .single();

        if (error) throw error;
        setAssessmentState(convertToAssessmentState(data));
      }

      lastSaveDataRef.current = currentDataString;
      setLastAutoSave(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [user, assessmentType, actualAssessmentKey, conflictResolution, assessmentState, getDeviceInfo]);

  // Manual save function
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
        assessment_key: actualAssessmentKey,
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
        
        const state = convertToAssessmentState(data);
        setAssessmentState(state);
        toast({
          title: "Sparat",
          description: "Dina svar har sparats säkert.",
          variant: "default"
        });
        
        return state;
      } else {
        const { data, error } = await supabase
          .from('assessment_states')
          .insert(saveData)
          .select()
          .single();

        if (error) throw error;
        
        const state = convertToAssessmentState(data);
        setAssessmentState(state);
        toast({
          title: "Sparat",
          description: "Dina svar har sparats säkert.",
          variant: "default"
        });
        
        return state;
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
  }, [user, assessmentType, actualAssessmentKey, conflictResolution, assessmentState, getDeviceInfo, toast]);

  // Clear draft
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

  // Missing methods that components expect
  const updateLastInteraction = useCallback(() => {
    // Update last interaction timestamp
    setLastAutoSave(new Date());
  }, []);

  const safeSubmit = useCallback(async (submitFunction: () => Promise<void>, preventDoubleSubmission?: boolean) => {
    try {
      await submitFunction();
      // Clear draft after successful submission
      if (assessmentState?.id) {
        await clearDraft();
      }
    } catch (error) {
      console.error('Safe submit failed:', error);
      throw error;
    }
  }, [assessmentState, clearDraft]);

  const safeNavigate = useCallback(async (navigateFunction: () => void, step?: string, requiresConfirmation?: boolean) => {
    if (hasUnsavedChanges) {
      // Auto-save before navigation
      await performAutoSave(formData, currentStep);
    }
    navigateFunction();
  }, [hasUnsavedChanges, performAutoSave, formData, currentStep]);

  const manualSave = useCallback(async () => {
    return await saveAssessmentState(formData, currentStep, true);
  }, [saveAssessmentState, formData, currentStep]);

  const clearDraftState = useCallback(() => {
    clearDraft();
  }, [clearDraft]);

  // Data change tracking
  const trackDataChange = useCallback((newData: Record<string, any>) => {
    const currentDataString = JSON.stringify(newData);
    if (currentDataString !== lastSaveDataRef.current) {
      setHasUnsavedChanges(true);
    }
  }, []);

  // Start auto-save
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

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, []);

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
    
    // New methods that components expect
    updateLastInteraction,
    safeSubmit,
    safeNavigate,
    manualSave,
    clearDraftState,
    
    // Utils
    setHasUnsavedChanges,
    setRecoveredData
  };
};