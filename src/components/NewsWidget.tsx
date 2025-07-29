import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  ExternalLink, 
  Calendar,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface NewsItem {
  id: string;
  data_type: string;
  source: string;
  data: {
    title?: string;
    url?: string;
    date?: string;
    source?: string;
    description?: string;
  };
  created_at: string;
}

interface NewsWidgetProps {
  newsItems: NewsItem[];
}

export const NewsWidget = ({ newsItems }: NewsWidgetProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayItems = isExpanded ? newsItems : newsItems.slice(0, 3);

  if (newsItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Senaste omnämnanden
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Inga omnämnanden hittade</p>
            <p className="text-sm">Kör dataCollector för att samla nyheter</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Senaste omnämnanden
            <Badge variant="secondary">{newsItems.length}</Badge>
          </CardTitle>
          {newsItems.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Visa mindre
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Visa alla ({newsItems.length})
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayItems.map((item, index) => (
            <div 
              key={item.id} 
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-sm leading-tight">
                    {item.data.title || 'Untitled'}
                  </h4>
                  {item.data.url && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="shrink-0"
                      onClick={() => window.open(item.data.url, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {item.data.source || item.source}
                  </Badge>
                  <span>•</span>
                  <span>
                    {item.data.date 
                      ? new Date(item.data.date).toLocaleDateString('sv-SE')
                      : new Date(item.created_at).toLocaleDateString('sv-SE')
                    }
                  </span>
                </div>
                
                {item.data.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.data.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};