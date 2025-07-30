import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { PillarType, PILLAR_CONFIGS } from '@/types/fivePillars';
import { useFivePillars } from '@/hooks/useFivePillars';
import { CheckCircle, Circle } from 'lucide-react';

interface PillarManagementProps {
  clientId: string;
  clientName: string;
}

export const PillarManagement = ({ clientId, clientName }: PillarManagementProps) => {
  const { assignments, assignPillar, removePillar, loading, getAssignedPillars } = useFivePillars(clientId);
  
  const assignedPillars = getAssignedPillars();
  const allPillars: PillarType[] = ['self_care', 'skills', 'talent', 'brand', 'economy'];

  const handlePillarToggle = async (pillarType: PillarType, isAssigned: boolean) => {
    if (isAssigned) {
      await removePillar(pillarType);
    } else {
      await assignPillar(pillarType);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pillar Management - {clientName}</CardTitle>
        <p className="text-muted-foreground">
          Välj vilka pelare som ska vara aktiva för denna klient
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {allPillars.map((pillarType) => {
          const config = PILLAR_CONFIGS[pillarType];
          const isAssigned = assignedPillars.includes(pillarType);
          
          return (
            <div
              key={pillarType}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePillarToggle(pillarType, isAssigned)}
                  disabled={loading}
                >
                  {isAssigned ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
                <div>
                  <h4 className="font-medium">{config.name}</h4>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAssigned && (
                  <Badge variant="secondary">Aktiv</Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {config.questions.length} frågor
                </span>
              </div>
            </div>
          );
        })}
        
        {assignedPillars.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            Inga pelare tilldelade än. Välj vilka områden klienten ska bedöma.
          </p>
        )}
      </CardContent>
    </Card>
  );
};