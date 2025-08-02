import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  Filter, 
  Users, 
  Brain,
  TrendingUp,
  Activity,
  Eye,
  Download,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useIntelligenceHub } from '@/hooks/useIntelligenceHub';
import { IntelligenceFilter } from '@/types/intelligenceHub';

interface IntelligenceSearchPanelProps {
  onProfileSelect: (userId: string) => void;
  selectedUserId?: string;
}

export function IntelligenceSearchPanel({ onProfileSelect, selectedUserId }: IntelligenceSearchPanelProps) {
  const {
    searchResults,
    searchLoading,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    searchProfiles
  } = useIntelligenceHub({ enableRealtime: true });

  const [showFilters, setShowFilters] = useState(false);
  const [localFilter, setLocalFilter] = useState<IntelligenceFilter>({});

  const handleSearch = async () => {
    await searchProfiles(searchQuery, activeFilter);
  };

  const handleFilterApply = () => {
    setActiveFilter(localFilter);
    searchProfiles(searchQuery, localFilter);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setLocalFilter({});
    setActiveFilter({});
    setSearchQuery('');
    searchProfiles('', {});
  };

  const categories = [
    'personal_development',
    'business_coaching',
    'health_wellness',
    'career_transition',
    'leadership',
    'other'
  ];

  return (
    <div className="w-96 border-r bg-white flex flex-col h-full">
      {/* Search Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-purple-600" />
          <h2 className="font-semibold">Intelligence Hub</h2>
        </div>
        
        <div className="space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök profiler, namn, e-post..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={handleSearch} 
              disabled={searchLoading}
              className="flex-1"
            >
              {searchLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Sök
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`${showFilters ? 'bg-blue-50 border-blue-200' : ''}`}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="mt-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Avancerade filter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Category Filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Kategorier</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {categories.map(category => (
                      <Badge
                        key={category}
                        variant={localFilter.category?.includes(category) ? 'default' : 'outline'}
                        className="cursor-pointer text-xs"
                        onClick={() => {
                          const current = localFilter.category || [];
                          const updated = current.includes(category)
                            ? current.filter(c => c !== category)
                            : [...current, category];
                          setLocalFilter({ ...localFilter, category: updated });
                        }}
                      >
                        {category.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tidsperiod</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Input
                      type="date"
                      value={localFilter.dateRange?.start?.toISOString().split('T')[0] || ''}
                      onChange={(e) => {
                        const start = e.target.value ? new Date(e.target.value) : undefined;
                        setLocalFilter({
                          ...localFilter,
                          dateRange: { ...localFilter.dateRange, start } as any
                        });
                      }}
                      className="text-xs"
                    />
                    <Input
                      type="date"
                      value={localFilter.dateRange?.end?.toISOString().split('T')[0] || ''}
                      onChange={(e) => {
                        const end = e.target.value ? new Date(e.target.value) : undefined;
                        setLocalFilter({
                          ...localFilter,
                          dateRange: { ...localFilter.dateRange, end } as any
                        });
                      }}
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={handleFilterApply} className="flex-1">
                    Tillämpa
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearFilters}>
                    Rensa
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Filters Display */}
          {(activeFilter.category?.length || activeFilter.dateRange) && (
            <div className="flex flex-wrap gap-1">
              {activeFilter.category?.map(cat => (
                <Badge key={cat} variant="secondary" className="text-xs">
                  {cat.replace('_', ' ')}
                </Badge>
              ))}
              {activeFilter.dateRange && (
                <Badge variant="secondary" className="text-xs">
                  Datum: {activeFilter.dateRange.start?.toLocaleDateString()} - {activeFilter.dateRange.end?.toLocaleDateString()}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {searchLoading ? (
          <div className="p-4 text-center">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Söker profiler...</p>
          </div>
        ) : !searchResults ? (
          <div className="p-4 text-center">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-2">Börja söka</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sök efter klientprofiler för att se deras intelligence-data
            </p>
            <Button variant="outline" onClick={() => searchProfiles('', {})}>
              <Users className="h-4 w-4 mr-2" />
              Visa alla profiler
            </Button>
          </div>
        ) : searchResults.profiles.length === 0 ? (
          <div className="p-4 text-center">
            <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Inga profiler hittades</p>
            <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
              Rensa filter
            </Button>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {searchResults.profiles.map(profile => (
              <Card
                key={profile.userId}
                className={`
                  cursor-pointer hover:shadow-md transition-shadow
                  ${selectedUserId === profile.userId ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                `}
                onClick={() => onProfileSelect(profile.userId)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700">
                        {profile.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {profile.displayName}
                        </h4>
                        <div className="flex items-center gap-1">
                          <div className={`h-2 w-2 rounded-full ${
                            profile.dataQuality > 0.7 ? 'bg-green-400' :
                            profile.dataQuality > 0.4 ? 'bg-yellow-400' : 'bg-red-400'
                          }`} />
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground truncate mb-2">
                        {profile.email}
                      </p>

                      <div className="flex items-center gap-2 text-xs">
                        {profile.category && (
                          <Badge variant="secondary" className="text-xs">
                            {profile.category.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                        <div className="text-center">
                          <div className="font-medium">{profile.metrics.length}</div>
                          <div className="text-muted-foreground">Metrics</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{profile.insights.length}</div>
                          <div className="text-muted-foreground">Insights</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{profile.socialProfiles.length}</div>
                          <div className="text-muted-foreground">Social</div>
                        </div>
                      </div>

                      {/* Latest Insight Preview */}
                      {profile.insights.length > 0 && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <div className="flex items-center gap-1 mb-1">
                            <Activity className="h-3 w-3 text-purple-500" />
                            <span className="font-medium">Senaste insikt</span>
                          </div>
                          <p className="text-muted-foreground truncate">
                            {profile.insights[0].title}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {searchResults && (
        <div className="p-3 border-t bg-gray-50 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>{searchResults.totalCount} profiler hittade</span>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3" />
              <span>Uppdaterad: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}