import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock } from 'lucide-react';
import { PillarKey } from '@/types/fivePillarsModular';
import { useFivePillarsModular } from '@/hooks/useFivePillarsModular';
import { PillarHeatmap } from './PillarHeatmap';
import { ModularPillarAssessment } from './ModularPillarAssessment';
import { ModularPillarManager } from './ModularPillarManager';
import { PILLAR_MODULES, PILLAR_PRIORITY_ORDER } from '@/config/pillarModules';
import { HelpTooltip } from '@/components/HelpTooltip';
import { helpTexts } from '@/data/helpTexts';
import { AnalysisActions } from '@/components/ui/analysis-actions';

interface ModularPillarDashboardProps {
  userId: string;
  userName: string;
  isCoachView?: boolean;
}

export const ModularPillarDashboard = ({ 
  userId, 
  userName, 
  isCoachView = false 
}: ModularPillarDashboardProps) => {
  const { 
    pillarDefinitions, 
    getActivatedPillars, 
    getLatestAssessment, 
    generateHeatmapData,
    refreshData
  } = useFivePillarsModular(userId);
  
  const [selectedPillar, setSelectedPillar] = useState<PillarKey | null>(null);
  const [showManager, setShowManager] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState<{
    title: string;
    content: string;
    pillarName: string;
  } | null>(null);

  const activatedPillars = getActivatedPillars();
  const heatmapData = generateHeatmapData();

  // If in assessment mode
  if (selectedPillar) {
    return (
      <div className="space-y-4">
        <ModularPillarAssessment
          userId={userId}
          pillarKey={selectedPillar}
          onComplete={() => {
            refreshData(); // Refresh heatmap data after assessment
            setSelectedPillar(null);
          }}
          onBack={() => setSelectedPillar(null)}
        />
      </div>
    );
  }

  // If showing manager (coach view)
  if (showManager && isCoachView) {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setShowManager(false)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka till översikt
        </Button>
        <ModularPillarManager 
          userId={userId} 
          userName={userName} 
          isCoachView={true}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Five Pillars</h1>
            <HelpTooltip content="Five Pillars är ett utvecklingssystem med fem grundpelare för hållbar framgång och välmående." />
          </div>
          <p className="text-muted-foreground">
            {isCoachView 
              ? `Hantera ${userName}s utvecklingspelare` 
              : "Dina aktiverade utvecklingspelare"
            }
          </p>
        </div>
        
        {isCoachView && (
          <Button onClick={() => setShowManager(true)}>
            Hantera pelare
          </Button>
        )}
      </div>

      {/* Heatmap Overview */}
      <PillarHeatmap 
        heatmapData={heatmapData} 
        title={isCoachView ? `${userName}s Five Pillars Status` : "Din aktuella helhetsbild"}
        showInactive={isCoachView}
        userId={userId}
        isCoachView={isCoachView}
      />

      {/* Activated Pillars Details */}
      {activatedPillars.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">
              {isCoachView ? "Aktiverade pelare" : "Dina aktiva pelare"}
            </h2>
            <HelpTooltip content={helpTexts.fivePillars.pillarsOrder} />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PILLAR_PRIORITY_ORDER.map((pillarKey) => {
              if (!activatedPillars.includes(pillarKey)) return null;
              
              const pillarConfig = PILLAR_MODULES[pillarKey];
              const pillarDefinition = pillarDefinitions.find(p => p.pillar_key === pillarKey);
              const latestAssessment = getLatestAssessment(pillarKey);
              const heatmapEntry = heatmapData.find(h => h.pillar_key === pillarKey);
              
              return (
                <Card 
                  key={pillarKey} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  style={{ borderColor: `${pillarDefinition?.color_code}20` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{pillarConfig.icon}</span>
                        <CardTitle className="text-lg">{pillarConfig.name}</CardTitle>
                        <HelpTooltip 
                          content={helpTexts.fivePillars[pillarKey as keyof typeof helpTexts.fivePillars] || pillarConfig.description}
                        />
                      </div>
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        {latestAssessment 
                          ? `Senaste bedömning: ${new Date(latestAssessment.created_at).toLocaleDateString('sv-SE')}`
                          : 'Ingen bedömning gjord än'
                        }
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{pillarConfig.description}</p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {latestAssessment ? (
                      <div className="space-y-3">
                        {/* Current Score */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-muted-foreground">Nuvarande poäng</span>
                            <HelpTooltip content={helpTexts.fivePillars.pillarScore} />
                          </div>
                          <div className="flex items-center gap-2">
                            <span 
                              className="text-lg font-bold"
                              style={{ color: pillarDefinition?.color_code }}
                            >
                              {latestAssessment.calculated_score?.toFixed(1) || '—'}
                            </span>
                            <span className="text-sm text-muted-foreground">/ 10</span>
                          </div>
                        </div>

                        {/* AI Analysis Preview */}
                        {latestAssessment.ai_analysis && (
                          <div 
                            className="p-3 bg-muted rounded text-sm cursor-pointer hover:bg-muted/80 transition-colors"
                            onClick={() => {
                              setShowAnalysisModal({
                                title: `AI-analys för ${pillarConfig.name}`,
                                content: latestAssessment.ai_analysis,
                                pillarName: pillarConfig.name
                              });
                            }}
                          >
                            <p className="line-clamp-3">
                              {latestAssessment.ai_analysis.substring(0, 150)}...
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Klicka för att läsa hela analysen</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          Klicka på knappen nedan för att göra din första bedömning
                        </p>
                      </div>
                    )}
                    
                    {!isCoachView && (
                      <Button 
                        onClick={() => setSelectedPillar(pillarKey)}
                        className="w-full"
                        variant={latestAssessment ? "outline" : "default"}
                        style={latestAssessment ? {} : { backgroundColor: pillarDefinition?.color_code }}
                      >
                        {latestAssessment ? "Uppdatera bedömning" : "Gör bedömning"}
                      </Button>
                    )}

                    {isCoachView && latestAssessment && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>Senast uppdaterad: {new Date(latestAssessment.updated_at).toLocaleDateString('sv-SE')}</span>
                        <HelpTooltip content={helpTexts.fivePillars.lastAssessment} />
                      </div>
                    )}
                  </CardContent>
                </Card>
            );
          })}
        </div>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-10">
            <h2 className="text-xl font-semibold mb-2">
              {isCoachView ? "Inga pelare aktiverade" : "Inga pelare tilldelade"}
            </h2>
            <p className="text-muted-foreground">
              {isCoachView 
                ? "Aktivera pelare för klienten genom att klicka på 'Hantera pelare'" 
                : "Din coach har inte aktiverat några utvecklingspelare än."
              }
            </p>
            {isCoachView && (
              <Button 
                onClick={() => setShowManager(true)}
                className="mt-4"
              >
                Aktivera pelare
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline Integration */}
      {!isCoachView && activatedPillars.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Min utvecklingsresa</h2>
          <div className="bg-muted/30 rounded-lg p-1">
            <p className="text-sm text-muted-foreground text-center py-2">
              Detaljerad tidslinjevy finns under "Min resa" i huvudmenyn
            </p>
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      {showAnalysisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAnalysisModal(null)}>
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{showAnalysisModal.title}</h3>
              <div className="flex items-center gap-2">
                <AnalysisActions
                  title={showAnalysisModal.title}
                  content={showAnalysisModal.content}
                  clientName={userName}
                  assessmentType={showAnalysisModal.pillarName}
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAnalysisModal(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
            </div>
            <div className="text-sm whitespace-pre-wrap border-t pt-4">{showAnalysisModal.content}</div>
          </div>
        </div>
      )}
    </div>
  );
};