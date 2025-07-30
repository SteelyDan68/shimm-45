import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, Brain, Users, Gauge } from "lucide-react";
import { useCapacityAssessment } from "@/hooks/useCapacityAssessment";
import { Skeleton } from "@/components/ui/skeleton";

interface CapacityBarometerProps {
  clientId: string;
  variant?: 'full' | 'compact';
  showTitle?: boolean;
}

export function CapacityBarometer({ 
  clientId, 
  variant = 'full',
  showTitle = true 
}: CapacityBarometerProps) {
  const { capacityData, loading, capacityLevel, assessmentCount } = useCapacityAssessment(clientId);
  
  console.log('CapacityBarometer debug:', { capacityData, assessmentCount, clientId });

  if (loading) {
    return (
      <Card className={variant === 'compact' ? 'p-3' : ''}>
        {showTitle && (
          <CardHeader className={variant === 'compact' ? 'pb-2' : ''}>
            <CardTitle className={`flex items-center gap-2 ${variant === 'compact' ? 'text-sm' : ''}`}>
              <Gauge className={`${variant === 'compact' ? 'h-4 w-4' : 'h-5 w-5'}`} />
              Kapacitetsbarometer
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={variant === 'compact' ? 'pt-0' : ''}>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!capacityData || assessmentCount < 2) {
    return (
      <Card className={variant === 'compact' ? 'p-3' : ''}>
        {showTitle && (
          <CardHeader className={variant === 'compact' ? 'pb-2' : ''}>
            <CardTitle className={`flex items-center gap-2 ${variant === 'compact' ? 'text-sm' : ''}`}>
              <Gauge className={`${variant === 'compact' ? 'h-4 w-4' : 'h-5 w-5'}`} />
              Kapacitetsbarometer
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={variant === 'compact' ? 'pt-0' : ''}>
          <div className={`p-3 rounded-lg border bg-gray-50 border-gray-200`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">⏳</span>
              <span className={`font-medium text-gray-600 ${variant === 'compact' ? 'text-sm' : ''}`}>
                Inga data ännu
              </span>
            </div>
          </div>
          <p className={`text-muted-foreground mt-3 ${variant === 'compact' ? 'text-xs' : 'text-sm'}`}>
            Genomför minst två självskattningar för att se din kapacitetsbarometer.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Kapacitetsnivå färger och ikoner
  const capacityConfig = {
    low: {
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: '🔴',
      label: 'Låg kapacitet'
    },
    moderate: {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: '🟡',
      label: 'Måttlig kapacitet'
    },
    strong: {
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: '🟢',
      label: 'Stark kapacitet'
    }
  };

  const config = capacityConfig[capacityLevel];

  return (
    <Card className={variant === 'compact' ? 'p-3' : ''}>
      {showTitle && (
        <CardHeader className={variant === 'compact' ? 'pb-2' : ''}>
          <CardTitle className={`flex items-center gap-2 ${variant === 'compact' ? 'text-sm' : ''}`}>
            <Gauge className={`${variant === 'compact' ? 'h-4 w-4' : 'h-5 w-5'}`} />
            Kapacitetsbarometer
          </CardTitle>
          {variant === 'full' && (
            <p className="text-xs text-muted-foreground">
              Baserat på senaste självskattning ({new Date(capacityData.assessmentDate).toLocaleDateString('sv-SE')})
            </p>
          )}
        </CardHeader>
      )}
      <CardContent className={variant === 'compact' ? 'pt-0' : ''}>
        <div className="space-y-4">
          {/* Övergripande kapacitetsnivå */}
          <div className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{config.icon}</span>
              <span className={`font-medium ${config.color} ${variant === 'compact' ? 'text-sm' : ''}`}>
                {config.label}
              </span>
            </div>
          </div>

          {/* Detaljerade indikatorer */}
          <div className={`space-y-3 ${variant === 'compact' ? 'space-y-2' : ''}`}>
            {/* Funktionstillgång */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className={`text-orange-600 ${variant === 'compact' ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  <span className={`font-medium ${variant === 'compact' ? 'text-xs' : 'text-sm'}`}>
                    Funktionstillgång
                  </span>
                </div>
                <Badge variant="outline" className={`${variant === 'compact' ? 'text-xs px-1' : ''}`}>
                  {capacityData.functionalAccessCount}/4
                </Badge>
              </div>
              <Progress 
                value={(capacityData.functionalAccessCount / 4) * 100} 
                className={`${variant === 'compact' ? 'h-1' : 'h-2'}`}
              />
            </div>

            {/* Subjektiva möjligheter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className={`text-purple-600 ${variant === 'compact' ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  <span className={`font-medium ${variant === 'compact' ? 'text-xs' : 'text-sm'}`}>
                    Möjligheter
                  </span>
                </div>
                <Badge variant="outline" className={`${variant === 'compact' ? 'text-xs px-1' : ''}`}>
                  {capacityData.subjectiveOpportunitiesAvg.toFixed(1)}/5
                </Badge>
              </div>
              <Progress 
                value={((capacityData.subjectiveOpportunitiesAvg - 1) / 4) * 100} 
                className={`${variant === 'compact' ? 'h-1' : 'h-2'}`}
              />
            </div>

            {/* Relationsstöd */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className={`text-green-600 ${variant === 'compact' ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  <span className={`font-medium ${variant === 'compact' ? 'text-xs' : 'text-sm'}`}>
                    Relationsstöd
                  </span>
                </div>
                <Badge 
                  variant={capacityData.hasRegularSupport ? "default" : "destructive"}
                  className={`${variant === 'compact' ? 'text-xs px-1' : ''}`}
                >
                  {capacityData.hasRegularSupport ? 'Finns' : 'Saknas'}
                </Badge>
              </div>
              <div className={`w-full rounded-full ${variant === 'compact' ? 'h-1' : 'h-2'} ${
                capacityData.hasRegularSupport ? 'bg-green-200' : 'bg-red-200'
              }`}>
                <div 
                  className={`${variant === 'compact' ? 'h-1' : 'h-2'} rounded-full ${
                    capacityData.hasRegularSupport ? 'bg-green-600 w-full' : 'bg-red-600 w-0'
                  } transition-all duration-300`}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}