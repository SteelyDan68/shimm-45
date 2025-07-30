import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CheckCircle, Circle, Settings } from 'lucide-react';
import { PillarKey } from '@/types/fivePillarsModular';
import { PILLAR_MODULES, PILLAR_PRIORITY_ORDER } from '@/config/pillarModules';
import { useFivePillarsModular } from '@/hooks/useFivePillarsModular';

interface ModularPillarManagerProps {
  clientId: string;
  clientName: string;
  isCoachView?: boolean;
}

export const ModularPillarManager = ({ clientId, clientName, isCoachView = true }: ModularPillarManagerProps) => {
  const { 
    pillarDefinitions, 
    activations, 
    activatePillar, 
    deactivatePillar, 
    loading,
    getActivatedPillars,
    generateHeatmapData
  } = useFivePillarsModular(clientId);

  const activatedPillars = getActivatedPillars();
  const heatmapData = generateHeatmapData();

  const handlePillarToggle = async (pillarKey: PillarKey, isActive: boolean) => {
    if (isActive) {
      await deactivatePillar(pillarKey);
    } else {
      await activatePillar(pillarKey);
    }
  };

  if (!isCoachView) {
    // Client view - just show activated pillars
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dina Aktiva Pelare</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {PILLAR_PRIORITY_ORDER.map((pillarKey) => {
              if (!activatedPillars.includes(pillarKey)) return null;
              const pillarConfig = PILLAR_MODULES[pillarKey];
              const heatmapEntry = heatmapData.find(h => h.pillar_key === pillarKey);
              
              return (
                <div key={pillarKey} className="flex items-center gap-3 p-3 border rounded-lg">
                  <span className="text-xl">{pillarConfig.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-medium">{pillarConfig.name}</h4>
                    <p className="text-sm text-muted-foreground">{pillarConfig.description}</p>
                  </div>
                  {heatmapEntry && heatmapEntry.score > 0 && (
                    <Badge variant="outline">
                      {heatmapEntry.score.toFixed(1)}/10
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
          
          {activatedPillars.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              Inga pelare aktiverade än. Kontakta din coach.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Coach view - full management interface
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Five Pillars Management
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Hantera aktiverade pelare för {clientName}
            </p>
          </div>
          <Badge variant="outline">
            {activatedPillars.length} av 5 aktiva
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {pillarDefinitions.map((pillar) => {
          const isActivated = activatedPillars.includes(pillar.pillar_key);
          const pillarConfig = PILLAR_MODULES[pillar.pillar_key];
          const heatmapEntry = heatmapData.find(h => h.pillar_key === pillar.pillar_key);
          
          return (
            <div
              key={pillar.pillar_key}
              className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                isActivated ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {isActivated ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-xl">{pillar.icon}</span>
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium">{pillar.name}</h4>
                  <p className="text-sm text-muted-foreground">{pillar.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      style={{ backgroundColor: `${pillar.color_code}15`, color: pillar.color_code }}
                    >
                      {pillar.pillar_key}
                    </Badge>
                    {pillarConfig && (
                      <Badge variant="secondary">
                        {pillarConfig.questions.length} frågor
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {isActivated && heatmapEntry && heatmapEntry.score > 0 && (
                  <div className="text-right">
                    <div className="font-medium">{heatmapEntry.score.toFixed(1)}/10</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(heatmapEntry.last_assessment).toLocaleDateString('sv-SE')}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isActivated}
                    onCheckedChange={() => handlePillarToggle(pillar.pillar_key, isActivated)}
                    disabled={loading}
                  />
                  <Label className="text-sm">
                    {isActivated ? 'Aktiv' : 'Inaktiv'}
                  </Label>
                </div>
              </div>
            </div>
          );
        })}

        {/* Summary Section */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Sammanfattning</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Aktiverade pelare:</span>
              <span className="ml-2 font-medium">{activatedPillars.length} / 5</span>
            </div>
            <div>
              <span className="text-muted-foreground">Genomförda assessments:</span>
              <span className="ml-2 font-medium">
                {heatmapData.filter(h => h.score > 0).length} / {activatedPillars.length}
              </span>
            </div>
          </div>

          {activatedPillars.length > 0 && (
            <div className="mt-3 text-sm text-muted-foreground">
              Klienten kommer att se: {activatedPillars.map(p => PILLAR_MODULES[p].name).join(', ')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};