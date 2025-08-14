import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Calendar } from 'lucide-react';
import { PathFilters, PathEntryType, PillarType } from '@/types/clientPath';

interface TimelineFiltersProps {
  filters: PathFilters;
  setFilters: (filters: PathFilters) => void;
  onClose: () => void;
}

const ENTRY_TYPES: { value: PathEntryType; label: string }[] = [
  { value: 'assessment', label: 'Bedömning' },
  { value: 'recommendation', label: 'AI-råd' },
  { value: 'task_completed', label: 'Genomfört' },
  { value: 'check-in', label: 'Check-in' },
  { value: 'summary', label: 'Summering' },
  { value: 'action', label: 'Åtgärd' },
  { value: 'note', label: 'Anteckning' },
];

const PILLARS: { value: PillarType; label: string; icon: string }[] = [
  { value: 'self_care', label: 'Självomvårdnad', icon: '🧘' },
  { value: 'skills', label: 'Skills', icon: '🎯' },
  { value: 'talent', label: 'Talent', icon: '⭐' },
  { value: 'brand', label: 'Brand', icon: '🏆' },
  { value: 'economy', label: 'Economy', icon: '💰' },
];

const TIME_PERIODS = [
  { value: 7, label: 'Senaste 7 dagarna' },
  { value: 30, label: 'Senaste 30 dagarna' },
  { value: 90, label: 'Senaste 3 månaderna' },
  { value: 365, label: 'Senaste året' },
];

export const TimelineFilters = ({ filters, setFilters, onClose }: TimelineFiltersProps) => {
  const toggleType = (type: PathEntryType) => {
    const currentTypes = filters.type || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    setFilters({ ...filters, type: newTypes.length > 0 ? newTypes : undefined });
  };

  const togglePillar = (pillar: PillarType) => {
    const currentPillars = filters.pillar || [];
    const newPillars = currentPillars.includes(pillar)
      ? currentPillars.filter(p => p !== pillar)
      : [...currentPillars, pillar];
    
    setFilters({ ...filters, pillar: newPillars.length > 0 ? newPillars : undefined });
  };

  const setTimePeriod = (days: string) => {
    if (days === 'all') {
      setFilters({ 
        ...filters, 
        daysPeriod: undefined,
        startDate: undefined,
        endDate: undefined 
      });
    } else {
      const daysNumber = parseInt(days);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNumber);
      
      setFilters({ 
        ...filters, 
        daysPeriod: daysNumber,
        startDate,
        endDate: new Date()
      });
    }
  };

  const clearAllFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = filters.type?.length || filters.pillar?.length || filters.daysPeriod;

  return (
    <Card className="mt-4">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-sm">Filter</h3>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                Rensa alla
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Time Period Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Tidsperiod</label>
            <Select 
              value={filters.daysPeriod?.toString() || 'all'} 
              onValueChange={setTimePeriod}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla tidpunkter</SelectItem>
                {TIME_PERIODS.map(period => (
                  <SelectItem key={period.value} value={period.value.toString()}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Entry Type Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Typ av händelse</label>
            <div className="flex flex-wrap gap-2">
              {ENTRY_TYPES.map(type => (
                <Badge
                  key={type.value}
                  variant={filters.type?.includes(type.value) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleType(type.value)}
                >
                  {type.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Pillar Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Pelare</label>
            <div className="flex flex-wrap gap-2">
              {PILLARS.map(pillar => (
                <Badge
                  key={pillar.value}
                  variant={filters.pillar?.includes(pillar.value) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => togglePillar(pillar.value)}
                >
                  {pillar.icon} {pillar.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* AI Generated Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Ursprung</label>
            <div className="flex gap-2">
              <Badge
                variant={filters.aiGenerated === true ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setFilters({ 
                  ...filters, 
                  aiGenerated: filters.aiGenerated === true ? undefined : true 
                })}
              >
                AI-genererat
              </Badge>
              <Badge
                variant={filters.aiGenerated === false ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setFilters({ 
                  ...filters, 
                  aiGenerated: filters.aiGenerated === false ? undefined : false 
                })}
              >
                Manuellt
              </Badge>
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {filters.type?.length && `${filters.type.length} typ(er)`}
                {filters.pillar?.length && ` • ${filters.pillar.length} pelare`}
                {filters.daysPeriod && ` • ${filters.daysPeriod} dagar`}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};