/**
 * 🏥 SYSTEM HEALTH WIDGET
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Heart, AlertCircle, CheckCircle2 } from 'lucide-react';
import { EnhancedTooltip, InfoTooltip, SuccessTooltip, WarningTooltip } from '@/components/ui/enhanced-tooltip';
import { WidgetProps } from '../types/dashboard-types';

const SystemHealthWidget: React.FC<WidgetProps> = () => {
  // Simulerad hälsodata för demo
  const healthMetrics = {
    overall: 98.5,
    database: 99.2,
    api: 97.8,
    ai_services: 98.9,
    storage: 96.4
  };

  const getHealthColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthStatus = (score: number) => {
    if (score >= 95) return 'Utmärkt';
    if (score >= 85) return 'Bra';
    return 'Behöver uppmärksamhet';
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Heart className="h-5 w-5 text-red-500" />
          Systemhälsa
          <InfoTooltip 
            content="Real-time övervakning av alla kritiska systemkomponenter och tjänster"
            size="sm"
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Health Score */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${getHealthColor(healthMetrics.overall)}`}>
            {healthMetrics.overall}%
          </div>
          <p className="text-sm text-muted-foreground">Övergripande hälsa</p>
          <Badge variant={healthMetrics.overall >= 95 ? "default" : "destructive"} className="mt-2">
            {getHealthStatus(healthMetrics.overall)}
          </Badge>
        </div>

        {/* Individual Components */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Databas</span>
              <EnhancedTooltip 
                content="Prestanda och tillgänglighet för databasanslutningar"
                variant="info"
                size="sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-mono ${getHealthColor(healthMetrics.database)}`}>
                {healthMetrics.database}%
              </span>
              {healthMetrics.database >= 95 ? 
                <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              }
            </div>
          </div>
          <Progress value={healthMetrics.database} className="h-2" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">API</span>
              <EnhancedTooltip 
                content="Responstider och felfrekvens för API-anrop"
                variant="info"
                size="sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-mono ${getHealthColor(healthMetrics.api)}`}>
                {healthMetrics.api}%
              </span>
              {healthMetrics.api >= 95 ? 
                <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              }
            </div>
          </div>
          <Progress value={healthMetrics.api} className="h-2" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">AI-tjänster</span>
              <EnhancedTooltip 
                content="Tillgänglighet och prestanda för AI-relaterade funktioner"
                variant="feature"
                size="sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-mono ${getHealthColor(healthMetrics.ai_services)}`}>
                {healthMetrics.ai_services}%
              </span>
              {healthMetrics.ai_services >= 95 ? 
                <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              }
            </div>
          </div>
          <Progress value={healthMetrics.ai_services} className="h-2" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Lagring</span>
              <EnhancedTooltip 
                content="Diskutrymme och filhanteringssystem"
                variant="info"
                size="sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-mono ${getHealthColor(healthMetrics.storage)}`}>
                {healthMetrics.storage}%
              </span>
              {healthMetrics.storage >= 95 ? 
                <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              }
            </div>
          </div>
          <Progress value={healthMetrics.storage} className="h-2" />
        </div>

        {/* Last Updated */}
        <div className="text-center pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Senast uppdaterad: {new Date().toLocaleTimeString('sv-SE')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthWidget;