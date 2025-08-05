import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Zap, Clock } from 'lucide-react';

interface SearchSuggestionsProps {
  suggestions: string[];
  recentSearches: string[];
  onSelectSuggestion: (suggestion: string) => void;
  onSelectRecent: (query: string) => void;
  className?: string;
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  suggestions,
  recentSearches,
  onSelectSuggestion,
  onSelectRecent,
  className = ""
}) => {
  const hasSuggestions = suggestions.length > 0;
  const hasRecent = recentSearches.length > 0;

  if (!hasSuggestions && !hasRecent) {
    return null;
  }

  return (
    <Card className={className}>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* Live Suggestions */}
          {hasSuggestions && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-3 w-3 text-primary" />
                <span className="text-mobile-xs font-medium text-muted-foreground">
                  Förslag
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <Badge
                    key={`suggestion-${index}`}
                    variant="outline"
                    className="cursor-pointer touch-target-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => onSelectSuggestion(suggestion)}
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {hasRecent && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-mobile-xs font-medium text-muted-foreground">
                  Senaste sökningar
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.slice(0, 6).map((recent, index) => (
                  <Badge
                    key={`recent-${index}`}
                    variant="secondary"
                    className="cursor-pointer touch-target-sm hover:bg-muted transition-colors"
                    onClick={() => onSelectRecent(recent)}
                  >
                    {recent}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};