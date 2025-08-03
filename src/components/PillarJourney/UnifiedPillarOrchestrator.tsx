import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useUserPillars } from '@/hooks/useUserPillars';
import { useWelcomeAssessment } from '@/hooks/useWelcomeAssessment';
import { PillarKey } from '@/types/sixPillarsModular';
import EnhancedPillarGateway from './EnhancedPillarGateway';
import IntensityCalibrationDialog, { IntensityLevel, DurationLevel } from './IntensityCalibrationDialog';
import EnhancedDevelopmentPlanGenerator from './EnhancedDevelopmentPlanGenerator';
import { ModularPillarAssessment } from '@/components/SixPillars/ModularPillarAssessment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Target, Sparkles } from 'lucide-react';
import { PILLAR_MODULES } from '@/config/pillarModules';

type FlowState = 
  | 'gateway'           // Show pillar selection
  | 'assessment'        // Taking pillar assessment  
  | 'calibration'       // Intensity/duration selection
  | 'plan_generation'   // AI creating development plan
  | 'plan_complete';    // Plan ready, show results

interface UnifiedPillarOrchestratorProps {
  className?: string;
}

const UnifiedPillarOrchestrator: React.FC<UnifiedPillarOrchestratorProps> = ({
  className = ""
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [flowState, setFlowState] = useState<FlowState>('gateway');
  const [selectedPillar, setSelectedPillar] = useState<PillarKey | null>(null);
  const [assessmentData, setAssessmentData] = useState<Record<string, any> | null>(null);
  const [intensity, setIntensity] = useState<IntensityLevel | null>(null);
  const [duration, setDuration] = useState<DurationLevel | null>(null);
  const [generatedActivities, setGeneratedActivities] = useState<any[]>([]);

  // Hooks for data
  const { 
    activations, 
    assessments, 
    loading: pillarsLoading,
    getActivatedPillars,
    getCompletedPillars,
    refetch: refetchPillarData
  } = useUserPillars(user?.id || '');

  const { 
    loading: welcomeLoading,
    hasCompletedWelcomeAssessment 
  } = useWelcomeAssessment();

  const completedPillars = getCompletedPillars();
  
  // Simple recommended pillar - start with self_care
  const getRecommendedPillar = (): PillarKey => {
    return 'self_care';
  };

  const recommendedPillar = getRecommendedPillar();
  const isFirstTime = completedPillars.length === 0;

  const handlePillarSelect = (pillarKey: PillarKey, isSequential: boolean) => {
    console.log('Pillar selected:', pillarKey, 'Sequential:', isSequential);
    setSelectedPillar(pillarKey);
    setFlowState('assessment');
  };

  const handleAssessmentComplete = async (pillarKey: PillarKey, data: Record<string, any>) => {
    console.log('Assessment completed for:', pillarKey, data);
    setAssessmentData(data);
    
    // Uppdatera pillar data efter genomförd assessment
    await refetchPillarData();
    
    setFlowState('calibration');

    toast({
      title: "🎯 Assessment genomförd!",
      description: "Nu anpassar vi din utvecklingsplan efter dina preferenser.",
    });
  };

  const handleCalibrationComplete = (selectedIntensity: IntensityLevel, selectedDuration: DurationLevel) => {
    console.log('Calibration completed:', selectedIntensity, selectedDuration);
    setIntensity(selectedIntensity);
    setDuration(selectedDuration);
    setFlowState('plan_generation');

    toast({
      title: "⚡ Preferenser sparade!",
      description: `${selectedIntensity.label} över ${selectedDuration.weeks} veckor. AI skapar nu din plan!`,
    });
  };

  const handlePlanGenerated = (activities: any[]) => {
    console.log('Plan generated with activities:', activities.length);
    setGeneratedActivities(activities);
    setFlowState('plan_complete');
  };

  const handleStartNewPillar = async () => {
    // Uppdatera data innan vi återgår till gateway
    await refetchPillarData();
    
    setSelectedPillar(null);
    setAssessmentData(null);
    setIntensity(null);
    setDuration(null);
    setGeneratedActivities([]);
    setFlowState('gateway');
  };

  // Loading state
  if (pillarsLoading || welcomeLoading) {
    return (
      <div className={`max-w-4xl mx-auto p-6 ${className}`}>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Laddar din pillar-resa...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto space-y-6 ${className}`}>
      {/* Progress Indicator */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Din Pillar-Utvecklingsresa
              </h2>
              <p className="text-sm text-muted-foreground">
                Steg {flowState === 'gateway' ? '1' : flowState === 'assessment' ? '2' : flowState === 'calibration' ? '3' : '4'} av 4
              </p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="bg-white">
                <CheckCircle className="w-3 h-3 mr-1" />
                {completedPillars.length}/6 Pillars klara
              </Badge>
            </div>
          </div>
          
          <Progress 
            value={
              flowState === 'gateway' ? 25 : 
              flowState === 'assessment' ? 50 : 
              flowState === 'calibration' ? 75 : 100
            } 
            className="h-2 mt-3" 
          />
          
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span className={flowState === 'gateway' ? 'text-blue-600 font-semibold' : ''}>
              Välj Pillar
            </span>
            <span className={flowState === 'assessment' ? 'text-blue-600 font-semibold' : ''}>
              Assessment
            </span>
            <span className={flowState === 'calibration' ? 'text-blue-600 font-semibold' : ''}>
              Anpassa Plan
            </span>
            <span className={flowState === 'plan_generation' || flowState === 'plan_complete' ? 'text-blue-600 font-semibold' : ''}>
              Färdig Plan
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Main Content based on flow state */}
      {flowState === 'gateway' && (
        <EnhancedPillarGateway
          userId={user?.id || ''}
          onPillarSelect={handlePillarSelect}
          completedPillars={completedPillars}
          recommendedPillar={recommendedPillar}
          isFirstTime={isFirstTime}
        />
      )}

      {flowState === 'assessment' && selectedPillar && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Assessment: {PILLAR_MODULES[selectedPillar].name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {PILLAR_MODULES[selectedPillar].description}
              </p>
            </CardContent>
          </Card>
          
          <ModularPillarAssessment
            userId={user?.id || ''}
            pillarKey={selectedPillar}
            onComplete={() => handleAssessmentComplete(selectedPillar, {})}
          />
        </div>
      )}

      {/* Intensity Calibration Dialog */}
      <IntensityCalibrationDialog
        isOpen={flowState === 'calibration'}
        onClose={handleStartNewPillar}
        onCalibrationComplete={handleCalibrationComplete}
        pillarName={selectedPillar ? PILLAR_MODULES[selectedPillar].name : ''}
      />

      {/* Plan Generation */}
      {flowState === 'plan_generation' && selectedPillar && assessmentData && intensity && duration && (
        <EnhancedDevelopmentPlanGenerator
          userId={user?.id || ''}
          pillarKey={selectedPillar}
          assessmentData={assessmentData}
          intensity={intensity}
          duration={duration}
          onPlanGenerated={handlePlanGenerated}
        />
      )}

      {/* Plan Complete */}
      {flowState === 'plan_complete' && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-6 h-6" />
                🎉 Din utvecklingsplan är aktiverad!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pillar genomförd</p>
                  <p className="font-semibold">{selectedPillar ? PILLAR_MODULES[selectedPillar].name : ''}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aktiviteter skapade</p>
                  <p className="font-semibold">{generatedActivities.length} stycken</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.href = '/calendar'}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  📅 Se i kalendern
                </button>
                <button
                  onClick={handleStartNewPillar}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  🔄 Nästa pillar
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default UnifiedPillarOrchestrator;