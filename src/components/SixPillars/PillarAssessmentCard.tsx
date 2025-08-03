/**
 * PILLAR ASSESSMENT CARD
 * 
 * Unified assessment card för Six Pillars using universal state management
 */

import React, { useState, useEffect } from 'react';
import { PillarKey } from '@/types/sixPillarsModular';
import { PILLAR_MODULES } from '@/config/pillarModules';
import { ModularPillarAssessment } from './ModularPillarAssessment';
import { usePillarAssessmentState, PillarAssessmentStatus } from '@/hooks/usePillarAssessmentState';
import { AssessmentStateCard, AssessmentStateData } from '@/components/ui/assessment-state-card';
import { get16YoText } from '@/config/language16yo';

interface PillarAssessmentCardProps {
  userId: string;
  pillarKey: PillarKey;
  variant?: 'default' | 'compact';
  onComplete?: () => void;
}

export const PillarAssessmentCard = ({ 
  userId, 
  pillarKey, 
  variant = 'default',
  onComplete 
}: PillarAssessmentCardProps) => {
  const { getAssessmentStatus, clearDraft, loading } = usePillarAssessmentState(pillarKey);
  const [showForm, setShowForm] = useState(false);
  const [assessmentStatus, setAssessmentStatus] = useState<PillarAssessmentStatus | null>(null);
  
  const pillarConfig = PILLAR_MODULES[pillarKey];

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
    onComplete?.();
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
      `Detta kommer att radera dina sparade svar för ${pillarConfig.name} och börja om från början. Är du säker?`
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
      title: `${pillarConfig.icon} ${pillarConfig.name}`,
      description: pillarConfig.description,
      timeEstimate: "10-15 min",
      neuroplasticPrinciple: get16YoText('journey', 'pillar_principle'),
      aiAnalysisPreview: `Personlig analys av dina styrkor och utvecklingsområden inom ${pillarConfig.name.toLowerCase()}`,
      customIcon: <span className="text-lg">{pillarConfig.icon}</span>,
      variant,
      onStart: handleStartAssessment,
      onResume: handleResumeAssessment,
      onRestart: handleRestartAssessment
    };

    if (assessmentStatus.hasCompleted) {
      return {
        ...baseData,
        state: 'completed' as const,
        description: `Du har slutfört ${pillarConfig.name}-bedömningen och fått din AI-analys!`,
        completedAt: assessmentStatus.latestAssessment?.created_at,
        canStart: false,
        canResume: false,
        canRestart: true,
        shouldShowForm: false
      };
    }

    if (assessmentStatus.hasInProgress) {
      const isExpired = assessmentStatus.statusMessage.includes('länge sedan');
      return {
        ...baseData,
        state: isExpired ? 'expired' : 'in_progress' as const,
        description: isExpired 
          ? `Ditt påbörjade ${pillarConfig.name}-test har gått ut. Starta om för bästa upplevelse.`
          : `Du har påbörjat ${pillarConfig.name}-testet - fortsätt där du slutade!`,
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
      description: `Bedöm din nuvarande situation inom ${pillarConfig.name.toLowerCase()} och få personliga rekommendationer`,
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
        title={`${pillarConfig.icon} ${pillarConfig.name}`}
        description="Kontrollerar din assessment-status..."
        variant={variant}
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
      <ModularPillarAssessment
        userId={userId}
        pillarKey={pillarKey}
        onComplete={handleAssessmentComplete}
        onBack={() => setShowForm(false)}
      />
    );
  }

  // Use the unified state card if we have state data
  if (stateData) {
    return <AssessmentStateCard {...stateData} />;
  }

  // Fallback
  return (
    <AssessmentStateCard
      state="error"
      title={`${pillarConfig.icon} ${pillarConfig.name}`}
      description="Kunde inte ladda assessment-status. Försök igen."
      variant={variant}
      canStart={true}
      canResume={false}
      canRestart={false}
      shouldShowForm={false}
      onStart={handleStartAssessment}
    />
  );
};