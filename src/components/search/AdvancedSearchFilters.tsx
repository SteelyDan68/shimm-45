import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchFilters } from '@/hooks/useGlobalSearch';
import { Calendar as CalendarIcon, X, Plus, Filter, Save } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface AdvancedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSaveSearch?: (name: string) => void;
  className?: string;
}

const SEARCH_TYPES = [
  { value: 'user', label: 'Användare', icon: '👤' },
  { value: 'message', label: 'Meddelanden', icon: '💬' },
  { value: 'task', label: 'Uppgifter', icon: '✅' },
  { value: 'calendar', label: 'Kalender', icon: '📅' },
  { value: 'assessment', label: 'Bedömningar', icon: '📊' },
  { value: 'organization', label: 'Organisationer', icon: '🏢' }
];

const STATUS_OPTIONS = [
  'aktiv', 'inaktiv', 'väntande', 'färdig', 'pågående', 'avbruten'
];

export const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onSaveSearch,
  className = ""
}) => {
  const [saveSearchName, setSaveSearchName] = React.useState('');
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);

  const toggleType = (type: string) => {
    const currentTypes = filters.types || [];
    const newTypes = currentTypes.includes(type as any)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type as any];
    
    onFiltersChange({ ...filters, types: newTypes });
  };

  const setDateRange = (field: 'start' | 'end', date: Date | undefined) => {
    if (!date) return;
    
    const currentRange = filters.dateRange || { start: new Date(), end: new Date() };
    onFiltersChange({
      ...filters,
      dateRange: {
        ...currentRange,
        [field]: date
      }
    });
  };

  const clearDateRange = () => {
    const { dateRange, ...restFilters } = filters;
    onFiltersChange(restFilters);
  };

  const addTag = (tag: string) => {
    if (!tag.trim()) return;
    const currentTags = filters.tags || [];
    if (!currentTags.includes(tag)) {
      onFiltersChange({
        ...filters,
        tags: [...currentTags, tag]
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = filters.tags || [];
    onFiltersChange({
      ...filters,
      tags: currentTags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSaveSearch = () => {
    if (saveSearchName.trim() && onSaveSearch) {
      onSaveSearch(saveSearchName.trim());
      setSaveSearchName('');
      setShowSaveDialog(false);
    }
  };

  const hasActiveFilters = Boolean(
    filters.types?.length ||
    filters.dateRange ||
    filters.status ||
    filters.tags?.length ||
    filters.userId
  );

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-mobile-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Avancerade filter
          </CardTitle>
          <div className="flex gap-2">
            {onSaveSearch && (
              <Popover open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Save className="h-3 w-3 mr-1" />
                    Spara
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-3">
                    <Label htmlFor="search-name">Namn på sparad sökning</Label>
                    <Input
                      id="search-name"
                      placeholder="t.ex. Aktiva klienter"
                      value={saveSearchName}
                      onChange={(e) => setSaveSearchName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveSearch()}
                    />
                    <Button
                      onClick={handleSaveSearch}
                      disabled={!saveSearchName.trim()}
                      className="w-full"
                      size="sm"
                    >
                      Spara sökning
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="h-3 w-3 mr-1" />
                Rensa alla
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search Types */}
        <div>
          <Label className="text-mobile-sm font-medium mb-2 block">
            Söktyper
          </Label>
          <div className="flex flex-wrap gap-2">
            {SEARCH_TYPES.map(type => (
              <Badge
                key={type.value}
                variant={filters.types?.includes(type.value as any) ? "default" : "outline"}
                className="cursor-pointer touch-target-sm"
                onClick={() => toggleType(type.value)}
              >
                <span className="mr-1">{type.icon}</span>
                {type.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <Label className="text-mobile-sm font-medium mb-2 block">
            Datumintervall
          </Label>
          <div className="flex gap-2 items-center flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-mobile-xs"
                >
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {filters.dateRange?.start 
                    ? format(filters.dateRange.start, 'dd MMM', { locale: sv })
                    : 'Från datum'
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateRange?.start}
                  onSelect={(date) => setDateRange('start', date)}
                  locale={sv}
                />
              </PopoverContent>
            </Popover>

            <span className="text-mobile-xs text-muted-foreground">till</span>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-mobile-xs"
                >
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {filters.dateRange?.end 
                    ? format(filters.dateRange.end, 'dd MMM', { locale: sv })
                    : 'Till datum'
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateRange?.end}
                  onSelect={(date) => setDateRange('end', date)}
                  locale={sv}
                />
              </PopoverContent>
            </Popover>

            {filters.dateRange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDateRange}
                className="text-mobile-xs"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <Label className="text-mobile-sm font-medium mb-2 block">
            Status
          </Label>
          <Select
            value={filters.status || ''}
            onValueChange={(value) => 
              onFiltersChange({ 
                ...filters, 
                status: value || undefined 
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Välj status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Alla statusar</SelectItem>
              {STATUS_OPTIONS.map(status => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tags */}
        <div>
          <Label className="text-mobile-sm font-medium mb-2 block">
            Taggar
          </Label>
          <div className="space-y-2">
            <div className="flex gap-1">
              <Input
                placeholder="Lägg till tagg"
                className="text-mobile-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTag((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Lägg till tagg"]') as HTMLInputElement;
                  if (input) {
                    addTag(input.value);
                    input.value = '';
                  }
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            
            {filters.tags && filters.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filters.tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-mobile-xs cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag}
                    <X className="h-2 w-2 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};