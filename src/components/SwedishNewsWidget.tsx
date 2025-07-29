import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Newspaper, 
  Clock, 
  ExternalLink,
  Calendar,
  User,
  FileText
} from 'lucide-react';

interface SwedishNewsItem {
  id: string;
  data_type: string;
  source: string;
  data: {
    title: string;
    url: string;
    snippet: string;
    source: string;
    date: string;
    query: string;
    type?: string;
    image?: string;
    author?: string;
    newsSource?: string;
  };
  created_at: string;
}

interface SwedishNewsWidgetProps {
  newsItems: SwedishNewsItem[] | null;
  clientName: string;
}

export const SwedishNewsWidget = ({ newsItems, clientName }: SwedishNewsWidgetProps) => {
  if (!newsItems || newsItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            Svenska nyheter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Newspaper className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Inga svenska nyheter hittade för {clientName}</p>
            <p className="text-sm mt-2">Kör DataCollector för att söka i svenska medier som:</p>
            <div className="flex flex-wrap justify-center gap-1 mt-2">
              {['Aftonbladet', 'Expressen', 'DN', 'SVD', 'SVT', 'SR', 'GP', 'Sydsvenskan'].map(source => (
                <Badge key={source} variant="outline" className="text-xs">
                  {source}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter for Swedish news only and sort by date
  const swedishNews = newsItems
    .filter(item => item.data.type === 'swedish_news')
    .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())
    .slice(0, 10); // Show latest 10

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Okänt datum';
    }
  };

  const getSourceIcon = (source: string) => {
    if (source.includes('aftonbladet')) return '🟥';
    if (source.includes('expressen')) return '🔵';
    if (source.includes('dn.se')) return '📰';
    if (source.includes('svd.se')) return '📈';
    if (source.includes('svt.se')) return '📺';
    if (source.includes('sr.se')) return '📻';
    if (source.includes('gp.se')) return '🌍';
    if (source.includes('sydsvenskan')) return '🌊';
    return '📰';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="h-5 w-5" />
          Svenska nyheter
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {swedishNews.length} artiklar
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Senaste omnämnanden av {clientName} i svenska medier
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {swedishNews.map((item, index) => {
          const newsData = item.data;
          
          return (
            <div key={index} className="border-l-4 border-primary/20 pl-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  {/* News source and date */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-base">{getSourceIcon(newsData.source)}</span>
                    <span className="font-medium">{newsData.newsSource || newsData.source}</span>
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(newsData.date)}</span>
                  </div>
                  
                  {/* Title */}
                  <h3 className="font-semibold leading-tight hover:text-primary transition-colors">
                    <a 
                      href={newsData.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="line-clamp-2"
                    >
                      {newsData.title}
                    </a>
                  </h3>
                  
                  {/* Snippet/Description */}
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {newsData.snippet}
                  </p>
                  
                  {/* Author if available */}
                  {newsData.author && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{newsData.author}</span>
                    </div>
                  )}
                </div>
                
                {/* News image if available */}
                {newsData.image && (
                  <div className="flex-shrink-0">
                    <img 
                      src={newsData.image} 
                      alt={newsData.title}
                      className="w-20 h-20 object-cover rounded border"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-7 px-2 text-xs"
                >
                  <a 
                    href={newsData.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Läs artikel
                  </a>
                </Button>
                
                <Badge variant="secondary" className="text-xs">
                  {newsData.query.replace(/"/g, '')}
                </Badge>
              </div>
            </div>
          );
        })}
        
        {swedishNews.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>Inga svenska nyheter hittade ännu</p>
            <p className="text-sm">Prova att köra datainsamling igen</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};