import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Filter, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MobileTouchButton, MobileContainer } from '@/components/ui/mobile-responsive';
import { useGlobalSearch, SearchResult, SearchFilters } from '@/hooks/useGlobalSearch';
import { useNavigation } from '@/hooks/useNavigation';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';

interface SearchBarProps {
  variant?: 'compact' | 'full';
  placeholder?: string;
  className?: string;
  onResultSelect?: (result: SearchResult) => void;
}

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

export const GlobalSearchBar: React.FC<SearchBarProps> = ({
  variant = 'compact',
  placeholder = 'Sök i NCCS...',
  className = '',
  onResultSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const { results, isLoading, search, clearResults, recentSearches, clearRecent } = useGlobalSearch();
  const { navigateTo } = useNavigation();
  const { hasRole } = useAuth();

  // Available search types based on user role
  const availableTypes = React.useMemo(() => {
    const types: (keyof typeof SEARCH_TYPE_LABELS)[] = ['user', 'message', 'task', 'calendar', 'assessment'];
    
    if (hasRole('superadmin') || hasRole('admin')) {
      types.push('organization');
    }
    
    return types;
  }, [hasRole]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        clearResults();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [clearResults]);

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.trim().length >= 2) {
      await search(searchQuery, filters);
    } else {
      clearResults();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    handleSearch(value);
  };

  const handleResultClick = (result: SearchResult) => {
    if (onResultSelect) {
      onResultSelect(result);
    } else if (result.url) {
      navigateTo(result.url);
    }
    setIsOpen(false);
    setQuery('');
    clearResults();
  };

  const handleRecentSearchClick = (searchQuery: string) => {
    setQuery(searchQuery);
    handleSearch(searchQuery);
  };

  const toggleTypeFilter = (type: keyof typeof SEARCH_TYPE_LABELS) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types?.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...(prev.types || []), type]
    }));
  };

  const SearchTrigger = variant === 'compact' ? (
    <MobileTouchButton
      variant="md"
      className="bg-muted hover:bg-muted/80 text-muted-foreground border-0 shadow-none"
      onClick={() => setIsOpen(true)}
    >
      <Search className="h-4 w-4 mr-2" />
      <span className="hidden sm:inline">Sök...</span>
      <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-auto">
        <span className="text-xs">⌘</span>K
      </kbd>
    </MobileTouchButton>
  ) : (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        className="pl-10 pr-4 w-full touch-target-md"
        onClick={() => setIsOpen(true)}
        readOnly
      />
    </div>
  );

  return (
    <>
      {SearchTrigger}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-mobile-lg">Sök i NCCS</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col h-full">
            {/* Search Input */}
            <div className="px-6 py-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  placeholder={placeholder}
                  value={query}
                  onChange={handleInputChange}
                  className="pl-10 pr-12 text-mobile-base touch-target-md"
                  autoFocus
                />
                
                {query && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => {
                      setQuery('');
                      clearResults();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Filters */}
              <div className="flex items-center gap-2 mt-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <Filter className="h-3 w-3 mr-1" />
                      Filter
                      {filters.types && filters.types.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-4 text-xs">
                          {filters.types.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuLabel>Söktyper</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {availableTypes.map(type => (
                      <DropdownMenuCheckboxItem
                        key={type}
                        checked={!filters.types || filters.types.includes(type)}
                        onCheckedChange={() => toggleTypeFilter(type)}
                      >
                        <span className="mr-2">{SEARCH_TYPE_ICONS[type]}</span>
                        {SEARCH_TYPE_LABELS[type]}
                      </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setFilters({})}>
                      Rensa filter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {recentSearches.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearRecent}
                    className="h-8 text-xs"
                  >
                    Rensa senaste
                  </Button>
                )}
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-auto">
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-mobile-sm text-muted-foreground">Söker...</span>
                </div>
              )}

              {!isLoading && query.length >= 2 && results.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 px-6">
                  <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-mobile-base font-medium mb-2">Inga resultat hittades</p>
                  <p className="text-mobile-sm text-muted-foreground text-center">
                    Prova att söka med andra ord eller justera filtren
                  </p>
                </div>
              )}

              {!query && recentSearches.length > 0 && (
                <div className="p-6">
                  <h3 className="text-mobile-sm font-medium text-muted-foreground mb-3 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Senaste sökningar
                  </h3>
                  <div className="space-y-2">
                    {recentSearches.slice(0, 5).map((recentQuery, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(recentQuery)}
                        className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors text-mobile-sm"
                      >
                        <TrendingUp className="h-3 w-3 inline mr-2 text-muted-foreground" />
                        {recentQuery}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.length > 0 && (
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-mobile-sm text-muted-foreground">
                      {results.length} resultat för "{query}"
                    </p>
                  </div>
                  
                  {results.map((result) => (
                    <Card 
                      key={`${result.type}-${result.id}`}
                      className="cursor-pointer hover:shadow-mobile-md transition-shadow"
                      onClick={() => handleResultClick(result)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="text-lg" aria-hidden="true">
                            {SEARCH_TYPE_ICONS[result.type]}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-mobile-base font-medium truncate">
                                {result.title}
                              </h4>
                              <Badge variant="secondary" className="text-xs">
                                {SEARCH_TYPE_LABELS[result.type]}
                              </Badge>
                            </div>
                            
                            {result.subtitle && (
                              <p className="text-mobile-sm text-muted-foreground mb-2">
                                {result.subtitle}
                              </p>
                            )}
                            
                            {result.content && (
                              <p className="text-mobile-sm text-muted-foreground line-clamp-2">
                                {result.content}
                              </p>
                            )}
                            
                            {result.created_at && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(result.created_at).toLocaleDateString('sv-SE', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};