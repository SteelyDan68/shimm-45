import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PillarHeatmapData } from '@/types/sixPillarsModular';
import { PILLAR_MODULES } from '@/config/pillarModules';
import { useNavigate } from 'react-router-dom';
import { HelpTooltip } from '@/components/HelpTooltip';
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PillarHeatmapProps {
  heatmapData: PillarHeatmapData[];
  title?: string;
  showInactive?: boolean;
  clientId?: string;
  userId?: string;
  isCoachView?: boolean;
  showDetails?: boolean;
  onPillarClick?: (pillarKey: string) => void;
}

export const PillarHeatmap = ({ 
  heatmapData, 
  title = "Six Pillars Heatmap", 
  showInactive = false,
  clientId,
  isCoachView = false,
  showDetails = false,
  onPillarClick
}: PillarHeatmapProps) => {
  const navigate = useNavigate();

  // Exakt färgkodning enligt ursprunglig prompt
  const getScoreColor = (score: number) => {
    if (score === 0) return 'bg-gray-100 text-gray-500 border-gray-200';
    if (score <= 3) return 'bg-red-100 text-red-700 border-red-200'; // 🔴 Kritisk
    if (score <= 6) return 'bg-orange-100 text-orange-700 border-orange-200'; // 🟠 Utmaning  
    return 'bg-green-100 text-green-700 border-green-200'; // 🟢 Stark
  };

  const getScoreEmoji = (score: number) => {
    if (score === 0) return '⚪';
    if (score <= 3) return '🔴';
    if (score <= 6) return '🟠'; 
    return '🟢';
  };

  const getScoreText = (score: number) => {
    if (score === 0) return 'Obearbetad';
    if (score <= 3) return 'Kritisk';
    if (score <= 6) return 'Utmaning';
    return 'Stark';
  };

  const handlePillarClick = (pillar: PillarHeatmapData) => {
    // Use custom callback if provided (även för obearbetade pelare)
    if (onPillarClick) {
      onPillarClick(pillar.pillar_key);
      return;
    }
    
    // Default navigation för obearbetade pelare - starta assessment
    if (pillar.score === 0) return;
    
    // Default navigation for coach view - UNIFIED ROUTING
    if (isCoachView && clientId) {
      navigate(`/user/${clientId}?context=client&tab=pillars&pillar=${pillar.pillar_key}`);
    }
  };

  const displayData = showInactive ? heatmapData : heatmapData.filter(pillar => pillar.is_active);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {title}
            <HelpTooltip content="Six Pillars visualisering. Färgkodning: Grön (stark 7-10), Orange (utmaning 4-6), Röd (kritisk 1-3), Grå (obearbetad). Klicka på en pillar för att se detaljer eller göra ny bedömning." />
          </span>
          <Badge variant="outline" className="flex items-center gap-1">
            {displayData.filter(p => p.is_active).length} av 6 pelare
            <HelpTooltip content="Antal aktiva utvecklingsområden (Pillars) som du arbetar med just nu." />
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {displayData.map((pillar) => (
            <Tooltip key={pillar.pillar_key}>
              <TooltipTrigger asChild>
                <div
                  className={`
                    p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md
                    ${getScoreColor(pillar.score)}
                    ${pillar.score > 0 ? 'hover:scale-105' : 'cursor-not-allowed opacity-75'}
                  `}
                  onClick={() => handlePillarClick(pillar)}
                >
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl">{PILLAR_MODULES[pillar.pillar_key]?.icon || pillar.icon}</span>
                      <span className="text-lg">{getScoreEmoji(pillar.score)}</span>
                    </div>
                    
                    <h3 className="font-semibold text-sm">{PILLAR_MODULES[pillar.pillar_key]?.name || pillar.name}</h3>
                    
                    <div className="space-y-1">
                      <div className="text-2xl font-bold">
                        {pillar.score > 0 ? pillar.score.toFixed(1) : '—'}
                      </div>
                      <div className="text-xs font-medium">
                        {getScoreText(pillar.score)}
                      </div>
                    </div>

                    {pillar.score > 0 && (
                      <div className="flex items-center justify-center text-xs">
                        {pillar.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                        {pillar.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
                        {pillar.trend === 'stable' && <Minus className="h-3 w-3 text-gray-500" />}
                      </div>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">{PILLAR_MODULES[pillar.pillar_key]?.name || pillar.name}</p>
                  {pillar.score > 0 ? (
                    <>
                      <p className="text-sm">Poäng: {pillar.score.toFixed(1)}/10</p>
                      <p className="text-sm">Status: {getScoreText(pillar.score)}</p>
                      <p className="text-xs text-muted-foreground">
                        Senaste: {new Date(pillar.last_assessment).toLocaleDateString('sv-SE')}
                      </p>
                      {pillar.score > 0 && (
                        <p className="text-xs text-primary">
                          <ExternalLink className="h-3 w-3 inline mr-1" />
                          Klicka för att se senaste analys
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Ingen assessment genomförd än
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Sammanfattning */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold text-green-600">
                {displayData.filter(p => p.score >= 7).length}
              </div>
              <div className="text-muted-foreground flex items-center justify-center gap-1">
                Starka
                <HelpTooltip content="Områden med poäng 7-10. Dessa är dina styrkor som du kan bygga vidare på." />
              </div>
            </div>
            <div>
              <div className="font-semibold text-orange-600">
                {displayData.filter(p => p.score >= 4 && p.score < 7).length}
              </div>
              <div className="text-muted-foreground flex items-center justify-center gap-1">
                Utmaningar
                <HelpTooltip content="Områden med poäng 4-6. Dessa behöver uppmärksamhet och utveckling." />
              </div>
            </div>
            <div>
              <div className="font-semibold text-red-600">
                {displayData.filter(p => p.score > 0 && p.score < 4).length}
              </div>
              <div className="text-muted-foreground flex items-center justify-center gap-1">
                Kritiska
                <HelpTooltip content="Områden med poäng 1-3. Dessa kräver omedelbar uppmärksamhet och prioritet." />
              </div>
            </div>
            <div>
              <div className="font-semibold text-gray-500">
                {displayData.filter(p => p.score === 0).length}
              </div>
              <div className="text-muted-foreground flex items-center justify-center gap-1">
                Obearbetade
                <HelpTooltip content="Områden som inte har bedömts än. Dessa visas som grå rutor." />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};