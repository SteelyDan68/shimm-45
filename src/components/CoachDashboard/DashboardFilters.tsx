import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Filter, 
  Users, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import type { DashboardFilter, SortOption } from '@/hooks/useCoachDashboard';

interface DashboardFiltersProps {
  activeFilter: DashboardFilter;
  onFilterChange: (filter: DashboardFilter) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalClients: number;
  filteredCount: number;
  loading: boolean;
  onRefresh: () => void;
}

const filterOptions: { value: DashboardFilter; label: string; icon: any; color: string }[] = [
  { value: 'all', label: 'Alla klienter', icon: Users, color: 'bg-blue-500' },
  { value: 'a_clients', label: 'A-klienter', icon: TrendingUp, color: 'bg-green-500' },
  { value: 'highest_barriers', label: 'Störst hinder', icon: AlertTriangle, color: 'bg-red-500' },
  { value: 'inactive', label: 'Inaktiva', icon: Clock, color: 'bg-yellow-500' }
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'priority', label: 'Prioritet (högst först)' },
  { value: 'velocity', label: 'Velocity (lägst först)' },
  { value: 'barriers', label: 'Störst hinder' },
  { value: 'last_update', label: 'Senast uppdaterad' }
];

export function DashboardFilters({
  activeFilter,
  onFilterChange,
  sortBy,
  onSortChange,
  totalClients,
  filteredCount,
  loading,
  onRefresh
}: DashboardFiltersProps) {
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Coach Dashboard
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Uppdatera
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Visar {filteredCount} av {totalClients} klienter som behöver uppmärksamhet
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filter Buttons */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Filter</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {filterOptions.map(option => {
              const IconComponent = option.icon;
              const isActive = activeFilter === option.value;
              
              return (
                <Button
                  key={option.value}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => onFilterChange(option.value)}
                  className={`justify-start gap-2 ${
                    isActive ? '' : 'hover:bg-muted'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${option.color}`} />
                  <IconComponent className="h-4 w-4" />
                  <span className="hidden sm:inline">{option.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Sort Options */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Sortering</h4>
          <Select value={sortBy} onValueChange={(value: SortOption) => onSortChange(value)}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Välj sortering" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md">
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Filter Summary */}
        {activeFilter !== 'all' && (
          <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <Badge variant="default" className="flex items-center gap-1">
              {filterOptions.find(f => f.value === activeFilter)?.label}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {filteredCount} klient{filteredCount !== 1 ? 'er' : ''} visas
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onFilterChange('all')}
              className="ml-auto text-xs"
            >
              Rensa filter
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Laddar klientdata...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}