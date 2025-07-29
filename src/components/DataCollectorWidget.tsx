import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Globe, 
  Users, 
  Newspaper,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Play
} from 'lucide-react';
import { useDataCollector } from '@/hooks/useDataCollector';

interface DataCollectorWidgetProps {
  clientId: string;
  clientName: string;
  onDataCollected?: () => void;
}

export const DataCollectorWidget = ({ clientId, clientName, onDataCollected }: DataCollectorWidgetProps) => {
  const [lastResult, setLastResult] = useState<any>(null);
  const { collectData, isCollecting } = useDataCollector();

  const handleCollectData = async () => {
    const result = await collectData(clientId);
    if (result) {
      setLastResult(result);
      onDataCollected?.();
    }
  };

  const getDataTypeIcon = (type: string) => {
    switch (type) {
      case 'news': return <Newspaper className="h-4 w-4" />;
      case 'social_metrics': return <Users className="h-4 w-4" />;
      case 'web_scraping': return <Globe className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getDataTypeColor = (type: string) => {
    switch (type) {
      case 'news': return 'bg-blue-100 text-blue-800';
      case 'social_metrics': return 'bg-green-100 text-green-800';
      case 'web_scraping': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDataTypeName = (type: string) => {
    switch (type) {
      case 'news': return 'Nyheter';
      case 'social_metrics': return 'Sociala metrics';
      case 'web_scraping': return 'Web scraping';
      default: return type;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Live Datainsamling
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Real-time
            </Badge>
          </CardTitle>
          <Button 
            onClick={handleCollectData}
            disabled={isCollecting}
            className="flex items-center gap-2"
          >
            {isCollecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Samlar data...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Samla Live Data
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isCollecting && (
          <div className="space-y-4 mb-6">
            <div className="text-sm font-medium">Samlar data för {clientName}...</div>
            <Progress value={33} className="w-full" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Newspaper className="h-3 w-3" />
                Google News
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3 w-3" />
                Social Metrics
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Globe className="h-3 w-3" />
                Web Scraping
              </div>
            </div>
          </div>
        )}

        {!isCollecting && !lastResult && (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="font-semibold mb-2">Redo för live datainsamling</h3>
            <p className="text-sm mb-4">
              Samla färsk data från alla API:er för {clientName}
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-center gap-2">
                <Newspaper className="h-3 w-3" />
                <span>Google Custom Search (nyheter)</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Users className="h-3 w-3" />
                <span>Social Blade (metrics)</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Globe className="h-3 w-3" />
                <span>Firecrawl (web scraping)</span>
              </div>
            </div>
          </div>
        )}

        {lastResult && (
          <div className="space-y-4">
            {/* Success Summary */}
            <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-green-900">Datainsamling slutförd</p>
                <p className="text-sm text-green-700">
                  {lastResult.collected_data.news.length + 
                   lastResult.collected_data.social_metrics.length + 
                   lastResult.collected_data.web_scraping.length} datapunkter insamlade
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">
                <Clock className="h-3 w-3 mr-1" />
                Nyss
              </Badge>
            </div>

            {/* Data Breakdown */}
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(lastResult.collected_data).map(([type, items]: [string, any[]]) => (
                <div key={type} className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {getDataTypeIcon(type)}
                    <Badge className={getDataTypeColor(type)} variant="outline">
                      {getDataTypeName(type)}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">{items.length}</div>
                  <div className="text-xs text-muted-foreground">datapunkter</div>
                </div>
              ))}
            </div>

            {/* Errors (if any) */}
            {lastResult.errors.length > 0 && (
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-orange-900">
                    {lastResult.errors.length} varning(ar)
                  </span>
                </div>
                <div className="space-y-1">
                  {lastResult.errors.slice(0, 3).map((error: string, index: number) => (
                    <p key={index} className="text-xs text-orange-700">{error}</p>
                  ))}
                  {lastResult.errors.length > 3 && (
                    <p className="text-xs text-orange-600">
                      ...och {lastResult.errors.length - 3} till
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Nästa steg:</p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onDataCollected?.()}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Kör AI-analys
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCollectData}
                >
                  <Database className="h-3 w-3 mr-1" />
                  Samla mer data
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};