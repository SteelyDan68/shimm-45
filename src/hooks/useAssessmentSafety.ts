import { useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface AssessmentSafetyConfig {
  isActive: boolean;
  hasUnsavedChanges: boolean;
  onBeforeExit?: () => Promise<boolean>;
  preventAccidentalSubmission?: boolean;
}

/**
 * Hook för att säkerställa säker hantering av assessments
 * - Förhindrar oavsiktlig sidomladdning under pågående assessments
 * - Kräver explicit bekräftelse för att lämna sidan
 * - Säkerställer att endast avsiktliga åtgärder triggar inlämning
 */
export const useAssessmentSafety = (config: AssessmentSafetyConfig) => {
  const { toast } = useToast();
  const preventSubmissionRef = useRef(false);
  const lastInteractionRef = useRef<Date>(new Date());

  // Uppdatera senaste interaktion
  const updateLastInteraction = useCallback(() => {
    lastInteractionRef.current = new Date();
  }, []);

  // Kontrollera om åtgärden är avsiktlig (minst 1 sekund sedan senaste interaktion)
  const isIntentionalAction = useCallback(() => {
    const timeSinceLastInteraction = Date.now() - lastInteractionRef.current.getTime();
    return timeSinceLastInteraction > 1000; // Minst 1 sekund
  }, []);

  // Förhindra oavsiktlig sidomladdning
  useEffect(() => {
    if (!config.isActive) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (config.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Du har osparade ändringar. Är du säker på att du vill lämna sidan?';
        return e.returnValue;
      }
    };

    const handlePopState = async (e: PopStateEvent) => {
      if (config.hasUnsavedChanges && config.onBeforeExit) {
        e.preventDefault();
        const shouldExit = await config.onBeforeExit();
        if (!shouldExit) {
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Förhindra tillbaka-knappen
    if (config.hasUnsavedChanges) {
      window.history.pushState(null, '', window.location.href);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [config.isActive, config.hasUnsavedChanges, config.onBeforeExit]);

  // Säker submit-funktion som kräver explicit bekräftelse
  const safeSubmit = useCallback(async (
    submitFn: () => Promise<void>,
    requiresDoubleConfirm: boolean = true
  ) => {
    updateLastInteraction();

    // Kontrollera om det är en avsiktlig åtgärd
    if (config.preventAccidentalSubmission && !isIntentionalAction()) {
      toast({
        title: "För snabb åtgärd",
        description: "Vänta ett ögonblick innan du försöker igen",
        variant: "destructive"
      });
      return false;
    }

    // Dubbel bekräftelse för kritiska åtgärder
    if (requiresDoubleConfirm) {
      const confirmed = window.confirm(
        'Är du säker på att du vill slutföra och skicka in din bedömning? Detta kan inte ångras.'
      );
      
      if (!confirmed) {
        return false;
      }
    }

    try {
      await submitFn();
      return true;
    } catch (error) {
      console.error('Safe submit error:', error);
      toast({
        title: "Fel vid inlämning",
        description: "Något gick fel. Försök igen.",
        variant: "destructive"
      });
      return false;
    }
  }, [config.preventAccidentalSubmission, isIntentionalAction, toast, updateLastInteraction]);

  // Säker navigering mellan steg
  const safeNavigate = useCallback((
    navigationFn: () => void,
    requiresConfirmation: boolean = false
  ) => {
    updateLastInteraction();

    if (requiresConfirmation && config.hasUnsavedChanges) {
      const confirmed = window.confirm(
        'Du har osparade ändringar. Vill du fortsätta utan att spara?'
      );
      
      if (!confirmed) {
        return false;
      }
    }

    navigationFn();
    return true;
  }, [config.hasUnsavedChanges, updateLastInteraction]);

  // Auto-save med säkerhetskontroller
  const safeAutoSave = useCallback(async (
    autoSaveFn: () => Promise<void>,
    intervalMs: number = 30000
  ) => {
    if (!config.isActive || !config.hasUnsavedChanges) return;

    try {
      await autoSaveFn();
    } catch (error) {
      console.error('Auto-save error:', error);
      // Tyst fel för auto-save - vi vill inte störa användaren
    }
  }, [config.isActive, config.hasUnsavedChanges]);

  return {
    safeSubmit,
    safeNavigate,
    safeAutoSave,
    updateLastInteraction,
    isIntentionalAction,
  };
};