import React from 'react';
import { GlobalSearchBar } from '@/components/GlobalSearch/GlobalSearchBar';
import { useGlobalSearch, SearchFilters } from '@/hooks/useGlobalSearch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MobileContainer, MobileGrid } from '@/components/ui/mobile-responsive';
import { AdvancedSearchFilters } from '@/components/search/AdvancedSearchFilters';
import { SavedSearches } from '@/components/search/SavedSearches';
import { SearchSuggestions } from '@/components/search/SearchSuggestions';
import { Search, TrendingUp, Clock, Filter, X, Bookmark, Sparkles } from 'lucide-react';
import { useNavigation } from '@/hooks/useNavigation';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const SEARCH_TYPE_LABELS = {
  user: 'Användare',
  message: 'Meddelanden', 
  task: 'Uppgifter',
  calendar: 'Kalender',
  assessment: 'Bedömningar',
  path_entry: 'Loggposter',
  stefan: 'Stefan AI',
  organization: 'Organisationer'
};

const SEARCH_TYPE_ICONS = {
  user: '👤',
  message: '💬',
  task: '✅', 
  calendar: '📅',
  assessment: '📊',
  path_entry: '📝',
  stefan: '🤖',
  organization: '🏢'
};

export const GlobalSearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  
  const { 
    results, 
    isLoading, 
    search, 
    clearResults, 
    recentSearches, 
    clearRecent,
    totalResults,
    savedSearches,
    saveSearch,
    deleteSavedSearch,
    loadSavedSearch,
    searchSuggestions,
    generateSuggestions,
    clearSuggestions
  } = useGlobalSearch();
  
  const { navigateTo } = useNavigation();
  const { toast } = useToast();

  // Generate suggestions as user types
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.length >= 2) {
        generateSuggestions(query);
      } else {
        clearSuggestions();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, generateSuggestions, clearSuggestions]);

  const handleSearch = async () => {
    if (query.trim().length >= 2) {
      await search(query, filters);
      clearSuggestions();
    }
  };

  const handleSaveSearch = (name: string) => {
    saveSearch(query, filters, name);
    toast({
      title: "Sökning sparad",
      description: `"${name}" har sparats i dina sparade sökningar.`
    });
  };

  const handleLoadSavedSearch = async (savedSearch: any) => {
    setQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    await loadSavedSearch(savedSearch);
    setShowSavedSearches(false);
  };

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion);
    clearSuggestions();
    search(suggestion, filters);
  };

  return (
    <MobileContainer className="py-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-mobile-3xl font-bold mb-2">Sök i SHIMMS</h1>
          <p className="text-mobile-base text-muted-foreground">
            Hitta användare, meddelanden, uppgifter, bedömningar och mer
          </p>
        </div>

        {/* Main Search Interface */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-mobile-lg">Avancerad sökning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Input */}
            <div>
              <Label htmlFor="search-input" className="text-mobile-sm font-medium">
                Sökterm
              </Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-input"
                  placeholder="Skriv din sökning här..."
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 touch-target-md"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={handleSearch}
                disabled={!query.trim() || query.length < 2}
                className="touch-target-md"
              >
                <Search className="h-4 w-4 mr-2" />
                Sök
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="touch-target-md"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>

              {savedSearches.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowSavedSearches(!showSavedSearches)}
                  className="touch-target-md"
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  Sparade ({savedSearches.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Search Suggestions */}
        {(searchSuggestions.length > 0 || (!query && recentSearches.length > 0)) && (
          <SearchSuggestions
            suggestions={searchSuggestions}
            recentSearches={!query ? recentSearches : []}
            onSelectSuggestion={handleSuggestionSelect}
            onSelectRecent={handleSuggestionSelect}
            className="mb-6"
          />
        )}

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <AdvancedSearchFilters
            filters={filters}
            onFiltersChange={setFilters}
            onSaveSearch={query ? handleSaveSearch : undefined}
            className="mb-6"
          />
        )}

        {/* Saved Searches */}
        {showSavedSearches && (
          <SavedSearches
            savedSearches={savedSearches}
            onLoadSearch={handleLoadSavedSearch}
            onDeleteSearch={deleteSavedSearch}
            className="mb-6"
          />
        )}

        {/* Recent Searches */}
        {!query && recentSearches.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-mobile-base flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Senaste sökningar
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={clearRecent}>
                Rensa
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {recentSearches.slice(0, 8).map((recentQuery, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer touch-target-sm"
                    onClick={() => handleSuggestionSelect(recentQuery)}
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {recentQuery}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            <span className="text-mobile-base">Söker...</span>
          </div>
        )}

        {/* Search Results */}
        {!isLoading && results.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-mobile-xl font-semibold">
                Sökresultat ({totalResults})
              </h2>
              <Button variant="outline" size="sm" onClick={clearResults}>
                Rensa resultat
              </Button>
            </div>

            <MobileGrid columns={1} className="gap-4">
              {results.map((result, index) => (
                <Card 
                  key={`${result.type}-${result.id}-${index}`}
                  className="cursor-pointer hover:shadow-mobile-md transition-shadow"
                  onClick={() => result.url && navigateTo(result.url)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-xl flex-shrink-0" aria-hidden="true">
                        {SEARCH_TYPE_ICONS[result.type as keyof typeof SEARCH_TYPE_ICONS]}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-mobile-base font-medium truncate">
                            {result.title}
                          </h3>
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            {SEARCH_TYPE_LABELS[result.type as keyof typeof SEARCH_TYPE_LABELS]}
                          </Badge>
                        </div>
                        
                        {result.subtitle && (
                          <p className="text-mobile-sm text-muted-foreground mb-2">
                            {result.subtitle}
                          </p>
                        )}
                        
                        {result.content && (
                          <p className="text-mobile-sm text-muted-foreground line-clamp-2 mb-2">
                            {result.content}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          {result.created_at && (
                            <span>
                              {new Date(result.created_at).toLocaleDateString('sv-SE', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          )}
                          
                          {result.relevance_score && result.relevance_score > 0 && (
                            <span>
                              Relevans: {Math.round(result.relevance_score)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </MobileGrid>
          </div>
        )}

        {/* No Results */}
        {!isLoading && query.length >= 2 && results.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-mobile-lg font-medium mb-2">Inga resultat hittades</h3>
            <p className="text-mobile-base text-muted-foreground mb-4">
              Försök med andra sökord eller justera filtren
            </p>
            <Button variant="outline" onClick={() => setQuery('')}>
              Rensa sökning
            </Button>
          </div>
        )}

        {/* Search Tips */}
        {!query && recentSearches.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-mobile-base">Söktips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-mobile-sm">
                <p className="mb-2"><strong>🔍 Grundläggande sökning:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Skriv minst 2 tecken för att starta sökningen</li>
                  <li>Använd mellanslag för att söka efter flera ord</li>
                  <li>Stora och små bokstäver spelar ingen roll</li>
                </ul>
              </div>
              
              <div className="text-mobile-sm">
                <p className="mb-2"><strong>⚡ Snabbkommandon:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Tryck <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+K</kbd> (eller <kbd className="px-1 py-0.5 bg-muted rounded text-xs">⌘K</kbd>) för att öppna sökning</li>
                  <li>Tryck <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> för att söka</li>
                  <li>Tryck <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> för att stänga</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MobileContainer>
  );
};