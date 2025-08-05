import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SavedSearch } from '@/hooks/useGlobalSearch';
import { Bookmark, Trash2, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface SavedSearchesProps {
  savedSearches: SavedSearch[];
  onLoadSearch: (search: SavedSearch) => void;
  onDeleteSearch: (id: string) => void;
  className?: string;
}

const SEARCH_TYPE_LABELS: Record<string, string> = {
  user: 'Användare',
  message: 'Meddelanden',
  task: 'Uppgifter',
  calendar: 'Kalender',
  assessment: 'Bedömningar',
  organization: 'Organisationer'
};

export const SavedSearches: React.FC<SavedSearchesProps> = ({
  savedSearches,
  onLoadSearch,
  onDeleteSearch,
  className = ""
}) => {
  if (savedSearches.length === 0) {
    return null;
  }

  const formatFilterSummary = (search: SavedSearch) => {
    const parts: string[] = [];

    if (search.filters.types && search.filters.types.length > 0) {
      const typeLabels = search.filters.types.map(type => 
        SEARCH_TYPE_LABELS[type] || type
      );
      parts.push(`Typer: ${typeLabels.join(', ')}`);
    }

    if (search.filters.dateRange) {
      const start = format(new Date(search.filters.dateRange.start), 'dd MMM', { locale: sv });
      const end = format(new Date(search.filters.dateRange.end), 'dd MMM', { locale: sv });
      parts.push(`Datum: ${start} - ${end}`);
    }

    if (search.filters.status) {
      parts.push(`Status: ${search.filters.status}`);
    }

    if (search.filters.tags && search.filters.tags.length > 0) {
      parts.push(`Taggar: ${search.filters.tags.join(', ')}`);
    }

    return parts.join(' • ');
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-mobile-base flex items-center gap-2">
          <Bookmark className="h-4 w-4" />
          Sparade sökningar ({savedSearches.length})
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {savedSearches.map((search) => (
            <div
              key={search.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0 mr-3">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-mobile-sm font-medium truncate">
                    {search.name}
                  </h4>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    "{search.query}"
                  </Badge>
                </div>
                
                <div className="text-mobile-xs text-muted-foreground mb-1">
                  {formatFilterSummary(search)}
                </div>
                
                <div className="flex items-center gap-2 text-mobile-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Sparad: {format(new Date(search.created_at), 'dd MMM yyyy', { locale: sv })}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onLoadSearch(search)}
                  className="text-mobile-xs"
                >
                  Ladda
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteSearch(search.id)}
                  className="text-mobile-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};