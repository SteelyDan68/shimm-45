import { useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';

export interface AssessmentSafetyConfig {
  isActive: boolean;
  hasUnsavedChanges: boolean;
  assessmentType: 'welcome' | 'pillar' | 'open_track';
  assessmentKey?: string; // för pillar assessments
  currentStep: string;
  formData: Record<string, any>;
  onBeforeExit?: () => Promise<boolean>;
  onStateRestore?: (data: Record<string, any>) => void;
  preventAccidentalSubmission?: boolean;
  autoSaveInterval?: number;
}

/**
 * Förbättrad Assessment Safety Hook med GDPR-journaling och single source of truth
 * - Persistent state management med auto-save
 * - GDPR-kompatibel händelseloggning  
 * - Förhindrar data loss och ger användaren kontroll
 * - Integrerar med autonomous coach system
 */
export const useAssessmentSafety = (config: AssessmentSafetyConfig) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const preventSubmissionRef = useRef(false);
  const lastInteractionRef = useRef<Date>(new Date());
  const assessmentStateIdRef = useRef<string | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Log assessment event till GDPR-kompatibel logg
  const logAssessmentEvent = useCallback(async (
    eventType: string,
    eventData: Record<string, any> = {}
  ) => {
    if (!user?.id) return;

    try {
      await supabase.from('assessment_events').insert({
        user_id: user.id,
        assessment_state_id: assessmentStateIdRef.current,
        event_type: eventType,
        event_data: {
          ...eventData,
          assessment_type: config.assessmentType,
          assessment_key: config.assessmentKey,
          current_step: config.currentStep,
          timestamp: new Date().toISOString()
        },
        session_id: sessionStorage.getItem('session_id') || undefined,
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.warn('Failed to log assessment event:', error);
    }
  }, [user?.id, config.assessmentType, config.assessmentKey, config.currentStep]);

  // Ladda befintligt draft state
  const loadDraftState = useCallback(async () => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('assessment_states')
        .select('*')
        .eq('user_id', user.id)
        .eq('assessment_type', config.assessmentType)
        .eq('assessment_key', config.assessmentKey || '')
        .eq('is_draft', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        assessmentStateIdRef.current = data.id;
        await logAssessmentEvent('data_restored', { restored_data_keys: Object.keys(data.form_data) });
        
        if (config.onStateRestore && data.form_data && typeof data.form_data === 'object') {
          config.onStateRestore(data.form_data as Record<string, any>);
        }
        
        toast({
          title: "Pågående bedömning hittad",
          description: "Dina tidigare svar har återställts. Du kan fortsätta där du slutade.",
          variant: "default"
        });
        
        return data;
      }
    } catch (error) {
      console.error('Error loading draft state:', error);
    }
    
    return null;
  }, [user?.id, config.assessmentType, config.assessmentKey, config.onStateRestore, logAssessmentEvent, toast]);

  // Spara assessment state
  const saveAssessmentState = useCallback(async (isAutoSave = false) => {
    if (!user?.id || !config.formData) return false;

    try {
      const stateData = {
        user_id: user.id,
        assessment_type: config.assessmentType,
        assessment_key: config.assessmentKey || '',
        current_step: config.currentStep,
        form_data: config.formData,
        metadata: {
          last_updated: new Date().toISOString(),
          auto_save_count: isAutoSave ? 1 : 0
        },
        last_saved_at: new Date().toISOString()
      };

      if (assessmentStateIdRef.current) {
        const { error } = await supabase
          .from('assessment_states')
          .update(stateData)
          .eq('id', assessmentStateIdRef.current);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('assessment_states')
          .insert(stateData)
          .select('id')
          .single();
        
        if (error) throw error;
        assessmentStateIdRef.current = data.id;
      }

      await logAssessmentEvent(
        isAutoSave ? 'auto_saved' : 'manually_saved',
        { form_data_size: JSON.stringify(config.formData).length }
      );

      if (!isAutoSave) {
        toast({
          title: "Framsteg sparat",
          description: "Dina svar har sparats och du kan fortsätta senare.",
          variant: "default"
        });
      }

      return true;
    } catch (error) {
      console.error('Error saving assessment state:', error);
      if (!isAutoSave) {
        toast({
          title: "Kunde inte spara",
          description: "Ett fel uppstod när vi skulle spara dina svar. Försök igen.",
          variant: "destructive"
        });
      }
      return false;
    }
  }, [user?.id, config.assessmentType, config.assessmentKey, config.currentStep, config.formData, logAssessmentEvent, toast]);

  // Auto-save funktionalitet
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    if (config.hasUnsavedChanges && config.isActive) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveAssessmentState(true);
      }, config.autoSaveInterval || 30000); // 30 sekunder default
    }
  }, [config.hasUnsavedChanges, config.isActive, config.autoSaveInterval, saveAssessmentState]);

  // Uppdatera senaste interaktion och schemalägg auto-save
  const updateLastInteraction = useCallback(() => {
    lastInteractionRef.current = new Date();
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  // Kontrollera om åtgärden är avsiktlig
  const isIntentionalAction = useCallback(() => {
    const timeSinceLastInteraction = Date.now() - lastInteractionRef.current.getTime();
    return timeSinceLastInteraction > 1000;
  }, []);

  // Initialisering och cleanup
  useEffect(() => {
    if (config.isActive && user?.id) {
      // Ladda befintligt draft när hook aktiveras
      loadDraftState();
      
      // Logga att assessment har startats/återupptagits
      logAssessmentEvent('assessment_started', {
        current_step: config.currentStep
      });
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [config.isActive, user?.id]);

  // Förhindra oavsiktlig sidomladdning med förbättrad hantering
  useEffect(() => {
    if (!config.isActive) return;

    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (config.hasUnsavedChanges) {
        // Auto-save innan användaren lämnar
        await saveAssessmentState(true);
        
        e.preventDefault();
        e.returnValue = 'Du har en pågående bedömning. Den sparas automatiskt så du kan fortsätta senare.';
        return e.returnValue;
      }
    };

    const handlePopState = async (e: PopStateEvent) => {
      if (config.hasUnsavedChanges) {
        e.preventDefault();
        
        const shouldExit = await new Promise<boolean>((resolve) => {
          const userChoice = window.confirm(
            'Du har en pågående bedömning. Vill du:\n\n' +
            '• Klicka OK för att spara och lämna\n' +
            '• Klicka Avbryt för att fortsätta bedömningen'
          );
          resolve(userChoice);
        });

        if (shouldExit) {
          await saveAssessmentState(false);
          await logAssessmentEvent('assessment_abandoned', {
            reason: 'user_navigation',
            current_step: config.currentStep
          });
        } else {
          // Förhindra navigation
          window.history.pushState(null, '', window.location.href);
          await logAssessmentEvent('navigation_blocked', {
            reason: 'user_choice_continue'
          });
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Förhindra tillbaka-knappen när det finns osparade ändringar
    if (config.hasUnsavedChanges) {
      window.history.pushState(null, '', window.location.href);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [config.isActive, config.hasUnsavedChanges, config.currentStep, saveAssessmentState, logAssessmentEvent]);

  // Säker submit med fullständig state cleanup
  const safeSubmit = useCallback(async (
    submitFn: () => Promise<void>,
    requiresDoubleConfirm: boolean = true
  ) => {
    updateLastInteraction();

    // Dubbel bekräftelse för kritiska åtgärder
    if (requiresDoubleConfirm && config.preventAccidentalSubmission) {
      const confirmed = window.confirm(
        '🎯 Slutför bedömning\n\n' +
        'Är du säker på att du vill skicka in din bedömning?\n\n' +
        '✅ Du får omedelbar AI-analys\n' +
        '✅ Personliga rekommendationer\n' +
        '✅ Stefan kommer kontakta dig\n\n' +
        'Detta kan inte ångras.'
      );
      
      if (!confirmed) {
        await logAssessmentEvent('submission_cancelled', {
          reason: 'user_declined_confirmation'
        });
        return false;
      }
    }

    try {
      // Markera assessment som completed
      if (assessmentStateIdRef.current) {
        await supabase
          .from('assessment_states')
          .update({
            is_draft: false,
            completed_at: new Date().toISOString()
          })
          .eq('id', assessmentStateIdRef.current);
      }

      await logAssessmentEvent('assessment_completed', {
        completion_time_seconds: Date.now() - lastInteractionRef.current.getTime()
      });

      await submitFn();
      
      // Rensa auto-save timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      return true;
    } catch (error) {
      console.error('Safe submit error:', error);
      
      await logAssessmentEvent('submission_failed', {
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      
      toast({
        title: "Fel vid inlämning",
        description: "Något gick fel. Dina svar är sparade, försök igen.",
        variant: "destructive"
      });
      return false;
    }
  }, [config.preventAccidentalSubmission, updateLastInteraction, logAssessmentEvent, toast]);

  // Säker steg-navigering med auto-save
  const safeNavigate = useCallback(async (
    navigationFn: () => void,
    newStep: string,
    requiresConfirmation: boolean = false
  ) => {
    updateLastInteraction();

    if (requiresConfirmation && config.hasUnsavedChanges) {
      const userChoice = window.confirm(
        '💾 Spara framsteg?\n\n' +
        'Du har osparade ändringar. Vill du spara innan du fortsätter?\n\n' +
        '• Klicka OK för att spara och fortsätta\n' +
        '• Klicka Avbryt för att fortsätta utan att spara'
      );
      
      if (userChoice) {
        await saveAssessmentState(false);
      }
    } else if (config.hasUnsavedChanges) {
      // Auto-save vid steg-övergång
      await saveAssessmentState(true);
    }

    await logAssessmentEvent('step_changed', {
      from_step: config.currentStep,
      to_step: newStep
    });

    navigationFn();
    return true;
  }, [config.hasUnsavedChanges, config.currentStep, updateLastInteraction, saveAssessmentState, logAssessmentEvent]);

  // Manuell spara-funktion för användaren
  const manualSave = useCallback(async () => {
    updateLastInteraction();
    const success = await saveAssessmentState(false);
    return success;
  }, [updateLastInteraction, saveAssessmentState]);

  // Återställ från draft
  const restoreFromDraft = useCallback(async () => {
    const draftData = await loadDraftState();
    return draftData;
  }, [loadDraftState]);

  // Rensa draft state (vid avbrott)
  const clearDraftState = useCallback(async () => {
    if (!assessmentStateIdRef.current) return;

    try {
      await supabase
        .from('assessment_states')
        .update({
          abandoned_at: new Date().toISOString()
        })
        .eq('id', assessmentStateIdRef.current);

      await logAssessmentEvent('assessment_abandoned', {
        reason: 'user_explicit_abandon'
      });

      assessmentStateIdRef.current = null;
      
      toast({
        title: "Bedömning avbruten",
        description: "Dina svar har raderats.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error clearing draft state:', error);
    }
  }, [logAssessmentEvent, toast]);

  return {
    safeSubmit,
    safeNavigate,
    manualSave,
    restoreFromDraft,
    clearDraftState,
    updateLastInteraction,
    isIntentionalAction,
    scheduleAutoSave,
  };
};