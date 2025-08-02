import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Newspaper, 
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Eye,
  Search
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface NewsItem {
  id: string;
  title: string;
  summary?: string;
  url?: string;
  source: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  timestamp: Date;
  relevanceScore?: number;
  type?: string;
  snippet?: string;
}

interface IntelligenceNewsCardProps {
  newsMentions: NewsItem[];
  title?: string;
  maxItems?: number;
  showFilters?: boolean;
}

export function IntelligenceNewsCard({ 
  newsMentions, 
  title = "Senaste Nyhetsmentioner",
  maxItems = 5,
  showFilters = true
}: IntelligenceNewsCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Truncate long text properly
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    // Find last complete word before maxLength
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  };

  // Clean and format title
  const cleanTitle = (title: string) => {
    if (!title) return 'Utan titel';
    return title.length > 100 ? truncateText(title, 100) : title;
  };

  // Filter news by type if selected
  const filteredNews = selectedType 
    ? newsMentions.filter(item => item.type === selectedType)
    : newsMentions;

  // Get display items based on expanded state
  const displayItems = expanded ? filteredNews : filteredNews.slice(0, maxItems);

  // Get unique types for filtering
  const newsTypes = [...new Set(newsMentions.map(item => item.type).filter(Boolean))];

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'swedish_news': return 'bg-blue-100 text-blue-800';
      case 'general': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (newsMentions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-green-600" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Newspaper className="mx-auto h-12 w-12 opacity-50 mb-4" />
            <p>Inga nyhetsmentioner hittades</p>
            <p className="text-sm mt-2">Nya sökningar kommer att visas här</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-green-600" />
            {title}
            <Badge variant="outline" className="ml-2">
              {filteredNews.length}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {showFilters && newsTypes.length > 1 && (
              <div className="flex gap-1">
                <Button
                  variant={selectedType === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(null)}
                >
                  Alla
                </Button>
                {newsTypes.map(type => (
                  <Button
                    key={type}
                    variant={selectedType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType(type)}
                    className="capitalize"
                  >
                    {type?.replace('_', ' ') || 'Övriga'}
                  </Button>
                ))}
              </div>
            )}
            
            {filteredNews.length > maxItems && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Visa färre
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Visa alla ({filteredNews.length})
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className={expanded ? "h-96" : "h-auto"}>
          <div className="space-y-4">
            {displayItems.map((mention, index) => (
              <div key={`${mention.id}-${index}`}>
                <div className="space-y-3">
                  {/* Title and badges */}
                  <div className="space-y-2">
                    <h4 className="font-medium leading-tight">
                      {cleanTitle(mention.title)}
                    </h4>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      {mention.sentiment && (
                        <Badge variant="outline" className={getSentimentColor(mention.sentiment)}>
                          {mention.sentiment}
                        </Badge>
                      )}
                      
                      {mention.type && (
                        <Badge variant="outline" className={getTypeColor(mention.type)}>
                          {mention.type.replace('_', ' ')}
                        </Badge>
                      )}
                      
                      {mention.relevanceScore && (
                        <Badge variant="outline">
                          {Math.round(mention.relevanceScore * 100)}% relevant
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Summary/Snippet */}
                  {(mention.summary || mention.snippet) && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {truncateText(mention.summary || mention.snippet || '', 300)}
                      </p>
                    </div>
                  )}

                  {/* Footer with source and actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="font-medium">{mention.source}</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDistanceToNow(mention.timestamp, { addSuffix: true, locale: sv })}</span>
                      </div>
                    </div>
                    
                    {mention.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="text-xs"
                      >
                        <a 
                          href={mention.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Läs mer
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
                
                {index < displayItems.length - 1 && (
                  <Separator className="my-4" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {!expanded && filteredNews.length > maxItems && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => setExpanded(true)}
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-2" />
              Visa ytterligare {filteredNews.length - maxItems} nyhetsmentioner
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}