import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PillarHeatmapData } from '@/types/fivePillarsModular';

interface PillarHeatmapProps {
  heatmapData: PillarHeatmapData[];
  title?: string;
  showInactive?: boolean;
}

export const PillarHeatmap = ({ heatmapData, title = "Five Pillars Översikt", showInactive = false }: PillarHeatmapProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-500 text-white';
    if (score >= 6) return 'bg-yellow-500 text-white';
    if (score >= 4) return 'bg-orange-500 text-white';
    if (score > 0) return 'bg-red-500 text-white';
    return 'bg-gray-300 text-gray-600';
  };

  const getScoreText = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    if (score > 0) return 'Needs Work';
    return 'Not Assessed';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const filteredData = showInactive ? heatmapData : heatmapData.filter(pillar => pillar.is_active);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant="outline">
            {filteredData.length} av 5 pelare
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-5">
          {filteredData.map((pillar) => (
            <div
              key={pillar.pillar_key}
              className={`relative rounded-lg p-4 transition-all hover:shadow-md ${
                pillar.is_active ? 'opacity-100' : 'opacity-50'
              }`}
              style={{ backgroundColor: `${pillar.color_code}15` }}
            >
              {/* Pillar Icon and Name */}
              <div className="text-center mb-3">
                <div className="text-2xl mb-1">{pillar.icon}</div>
                <h3 className="font-medium text-sm">{pillar.name}</h3>
              </div>

              {/* Score Circle */}
              <div className="flex justify-center mb-3">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-sm font-bold ${getScoreColor(pillar.score)}`}
                >
                  {pillar.score > 0 ? pillar.score.toFixed(1) : '—'}
                </div>
              </div>

              {/* Score Text */}
              <div className="text-center mb-2">
                <p className="text-xs text-muted-foreground">{getScoreText(pillar.score)}</p>
              </div>

              {/* Trend and Last Assessment */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  {getTrendIcon(pillar.trend)}
                  <span className="capitalize">{pillar.trend}</span>
                </div>
                {pillar.last_assessment && (
                  <span>
                    {new Date(pillar.last_assessment).toLocaleDateString('sv-SE', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                )}
              </div>

              {/* Status Indicator */}
              <div className="absolute top-2 right-2">
                {pillar.is_active ? (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                ) : (
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Inga pelare aktiverade än.</p>
            <p className="text-sm">Kontakta din coach för att aktivera pelare.</p>
          </div>
        )}

        {/* Overall Score */}
        {filteredData.length > 0 && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Genomsnittlig poäng</h4>
                <p className="text-sm text-muted-foreground">Baserat på aktiverade pelare</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {(
                    filteredData
                      .filter(p => p.score > 0)
                      .reduce((sum, p) => sum + p.score, 0) /
                    filteredData.filter(p => p.score > 0).length || 0
                  ).toFixed(1)}
                </div>
                <p className="text-sm text-muted-foreground">av 10</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};