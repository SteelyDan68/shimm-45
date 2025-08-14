import React, { useState, useEffect } from 'react';
import { WelcomeAssessmentForm } from '@/components/WelcomeAssessment/WelcomeAssessmentForm';
import { useWelcomeAssessmentFixed, AssessmentStatus } from '@/hooks/useWelcomeAssessmentFixed';
import { AssessmentStateCard, AssessmentStateData } from '@/components/ui/assessment-state-card';

interface WelcomeAssessmentCardProps {
  userId: string;
}

export const WelcomeAssessmentCard = ({ userId }: WelcomeAssessmentCardProps) => {
  const { getAssessmentStatus, clearDraft, loading } = useWelcomeAssessmentFixed();
  const [showForm, setShowForm] = useState(false);
  const [assessmentStatus, setAssessmentStatus] = useState<AssessmentStatus | null>(null);

  useEffect(() => {
    const loadStatus = async () => {
      const status = await getAssessmentStatus();
      setAssessmentStatus(status);
    };
    
    if (userId) {
      loadStatus();
    }
  }, [userId, getAssessmentStatus]);

  const handleAssessmentComplete = () => {
    setShowForm(false);
    // Reload status after completion
    const reloadStatus = async () => {
      const status = await getAssessmentStatus();
      setAssessmentStatus(status);
    };
    reloadStatus();
  };

  const handleStartAssessment = () => {
    setShowForm(true);
  };

  const handleResumeAssessment = () => {
    setShowForm(true);
  };

  const handleRestartAssessment = async () => {
    const confirmed = confirm(
      'Detta kommer att radera dina sparade svar och börja om från början. Är du säker?'
    );
    
    if (confirmed) {
      await clearDraft();
      setShowForm(true);
      // Reload status after clearing
      const status = await getAssessmentStatus();
      setAssessmentStatus(status);
    }
  };

  // Convert to unified assessment state data
  const getAssessmentStateData = (): AssessmentStateData | null => {
    if (!assessmentStatus) return null;

    const baseData = {
      title: "Kolla läget! 📊",
      description: "Svara på enkla frågor om ditt liv så förstår vi vad du behöver",
      timeEstimate: "15 min",
      neuroplasticPrinciple: "Börja där du är idag",
      aiAnalysisPreview: "Personliga insikter och handlingsplaner baserat på dina svar",
      onStart: handleStartAssessment,
      onResume: handleResumeAssessment,
      onRestart: handleRestartAssessment
    };

    if (assessmentStatus.hasCompleted) {
      // Hide completed assessments completely from dashboard
      return null;
    }

    if (assessmentStatus.hasInProgress) {
      const isExpired = assessmentStatus.statusMessage.includes('länge sedan');
      return {
        ...baseData,
        state: isExpired ? 'expired' : 'in_progress' as const,
        description: isExpired 
          ? "Ditt påbörjade test har gått ut. Starta om för bästa upplevelse."
          : "Du har påbörjat testet - fortsätt där du slutade!",
        lastSavedAt: assessmentStatus.latestAssessment?.last_saved_at,
        progressInfo: assessmentStatus.statusMessage,
        canStart: false,
        canResume: !isExpired,
        canRestart: true,
        shouldShowForm: false
      };
    }

    // Not started
    return {
      ...baseData,
      state: 'not_started' as const,
      canStart: true,
      canResume: false,
      canRestart: false,
      shouldShowForm: false
    };
  };

  const stateData = getAssessmentStateData();

  // Show loading state
  if (loading) {
    return (
      <AssessmentStateCard
        state="not_started"
        title="Laddar..."
        description="Kontrollerar din assessment-status..."
        canStart={false}
        canResume={false}
        canRestart={false}
        shouldShowForm={false}
      />
    );
  }

  // Show the form if user is actively taking the assessment
  if (showForm) {
    return (
      <WelcomeAssessmentForm 
        onComplete={handleAssessmentComplete}
      />
    );
  }

  // Use the unified state card if we have state data
  if (stateData) {
    return <AssessmentStateCard {...stateData} />;
  }

  // Don't show anything if completed
  if (assessmentStatus?.hasCompleted) {
    return null;
  }

  // Fallback
  return (
    <AssessmentStateCard
      state="error"
      title="Fel vid laddning"
      description="Kunde inte ladda assessment-status. Försök igen."
      canStart={true}
      canResume={false}
      canRestart={false}
      shouldShowForm={false}
      onStart={handleStartAssessment}
    />
  );
};