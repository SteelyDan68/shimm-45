import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Newspaper, 
  ExternalLink, 
  Clock, 
  User, 
  ChevronLeft, 
  ChevronRight,
  Brain,
  Lightbulb
} from 'lucide-react';

interface NewsItem {
  id: string;
  data: {
    title: string;
    url: string;
    snippet: string;
    source: string;
    date: string;
    image?: string;
    author?: string;
    newsSource?: string;
  };
  created_at: string;
}

interface IntelligenceNewsSliderProps {
  newsItems: NewsItem[];
  userName: string;
  isCoachView: boolean;
}

export const IntelligenceNewsSlider = ({ newsItems, userName, isCoachView }: IntelligenceNewsSliderProps) => {
  const [displayCount, setDisplayCount] = useState([5]);
  const [currentPage, setCurrentPage] = useState(0);
  
  const maxItems = Math.min(15, newsItems.length);
  const itemsToShow = Math.min(displayCount[0], maxItems);
  const totalPages = Math.ceil(maxItems / itemsToShow);
  
  const currentItems = newsItems
    .slice(0, maxItems)
    .slice(currentPage * itemsToShow, (currentPage + 1) * itemsToShow);

  const generateAISummary = () => {
    if (newsItems.length === 0) return null;
    
    const recentNews = newsItems.slice(0, 5);
    const sources = [...new Set(recentNews.map(item => item.data.newsSource || item.data.source))];
    
    if (isCoachView) {
      return {
        title: "AI-analys för coach",
        summary: `${userName} har omnämnts i ${newsItems.length} artiklar från ${sources.length} olika källor. Senaste aktiviteten visar ${recentNews.length > 3 ? 'hög' : recentNews.length > 1 ? 'måttlig' : 'låg'} medieexponering. Rekommenderat att diskutera PR-strategi med klienten.`,
        insights: [
          `Mest aktiva källor: ${sources.slice(0, 3).join(', ')}`,
          `Mediefrekvens: ${(newsItems.length / Math.max(1, Math.ceil(newsItems.length / 7))).toFixed(1)} artiklar/vecka`,
          `Senaste trend: ${recentNews.length > 2 ? 'Ökande' : 'Stabil'} synlighet`
        ]
      };
    } else {
      return {
        title: "Din medieöversikt",
        summary: `Du har omnämnts i ${newsItems.length} artiklar från ${sources.length} olika källor. Din medienärvaro visar ${recentNews.length > 3 ? 'stark' : recentNews.length > 1 ? 'stabil' : 'begränsad'} synlighet i medier.`,
        insights: [
          `Främsta mediekanaler: ${sources.slice(0, 3).join(', ')}`,
          `Genomsnittlig exponering: ${(newsItems.length / Math.max(1, Math.ceil(newsItems.length / 7))).toFixed(1)} artiklar/vecka`,
          `Medietrend: ${recentNews.length > 2 ? 'Växande' : 'Konsekvent'} närvaro`
        ]
      };
    }
  };

  const aiSummary = generateAISummary();

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

  if (newsItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            Nyheter & Mediaomnämnanden
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Newspaper className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Inga nyheter hittade för {userName}</p>
            <p className="text-sm mt-2">Gå till fliken "Datainsamling" för att söka efter mediaomnämnanden</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      {aiSummary && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {aiSummary.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">{aiSummary.summary}</p>
            <div className="space-y-2">
              {aiSummary.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{insight}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* News Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              Nyheter & Mediaomnämnanden
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {newsItems.length} artiklar
              </Badge>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Sida {currentPage + 1} av {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm text-muted-foreground">Visa artiklar:</span>
              <div className="flex-1 max-w-48">
                <Slider
                  value={displayCount}
                  onValueChange={setDisplayCount}
                  max={maxItems}
                  min={1}
                  step={1}
                  className="flex-1"
                />
              </div>
              <span className="text-sm font-medium min-w-8">{displayCount[0]}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {currentItems.map((item, index) => {
            const newsData = item.data;
            
            return (
              <div key={index} className="border-l-4 border-primary/20 pl-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
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
                        className="w-24 h-24 object-cover rounded border"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
                
                {/* Action button */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-8 px-3 text-xs"
                  >
                    <a 
                      href={newsData.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Läs hela artikeln
                    </a>
                  </Button>
                </div>
              </div>
            );
          })}
          
          {/* Navigation info */}
          {maxItems > itemsToShow && (
            <div className="text-center text-sm text-muted-foreground border-t pt-4">
              Visar {currentItems.length} av {maxItems} artiklar
              {newsItems.length > 15 && (
                <span> (max 15 av totalt {newsItems.length})</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};