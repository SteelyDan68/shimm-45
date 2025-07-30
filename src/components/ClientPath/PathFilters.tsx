import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import type { PathFilters, PathEntryType, PathEntryStatus } from '@/types/clientPath';

interface PathFiltersProps {
  filters: PathFilters;
  onFiltersChange: (filters: PathFilters) => void;
  entryCount: number;
}

const typeOptions: { value: PathEntryType; label: string }[] = [
  { value: 'assessment', label: 'Bedömning' },
  { value: 'recommendation', label: 'Rekommendation' },
  { value: 'action', label: 'Åtgärd' },
  { value: 'note', label: 'Anteckning' },
  { value: 'check-in', label: 'Check-in' }
];

const statusOptions: { value: PathEntryStatus; label: string }[] = [
  { value: 'planned', label: 'Planerad' },
  { value: 'in_progress', label: 'Pågår' },
  { value: 'completed', label: 'Klar' }
];

export function PathFilters({ filters, onFiltersChange, entryCount }: PathFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleTypeChange = (type: PathEntryType, checked: boolean) => {
    const currentTypes = filters.type || [];
    const newTypes = checked
      ? [...currentTypes, type]
      : currentTypes.filter(t => t !== type);
    
    onFiltersChange({
      ...filters,
      type: newTypes.length > 0 ? newTypes : undefined
    });
  };

  const handleStatusChange = (status: PathEntryStatus, checked: boolean) => {
    const currentStatuses = filters.status || [];
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter(s => s !== status);
    
    onFiltersChange({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses : undefined
    });
  };

  const handleDateChange = (field: 'startDate' | 'endDate', date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      [field]: date
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = [
    filters.type?.length || 0,
    filters.status?.length || 0,
    filters.startDate ? 1 : 0,
    filters.endDate ? 1 : 0,
    filters.aiGenerated !== undefined ? 1 : 0
  ].reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Timeline ({entryCount} poster)</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary">
              {activeFilterCount} filter{activeFilterCount !== 1 ? '' : ''}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Rensa filter
            </Button>
          )}
          
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-background border shadow-md" align="end">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-3">Typ</h4>
                  <div className="space-y-2">
                    {typeOptions.map(option => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${option.value}`}
                          checked={filters.type?.includes(option.value) || false}
                          onCheckedChange={(checked) => 
                            handleTypeChange(option.value, checked as boolean)
                          }
                        />
                        <label 
                          htmlFor={`type-${option.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Status</h4>
                  <div className="space-y-2">
                    {statusOptions.map(option => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${option.value}`}
                          checked={filters.status?.includes(option.value) || false}
                          onCheckedChange={(checked) => 
                            handleStatusChange(option.value, checked as boolean)
                          }
                        />
                        <label 
                          htmlFor={`status-${option.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Datumintervall</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-12">Från:</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="justify-start">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            {filters.startDate ? format(filters.startDate, 'PPP', { locale: sv }) : 'Välj datum'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-background border shadow-md" align="start">
                          <Calendar
                            mode="single"
                            selected={filters.startDate}
                            onSelect={(date) => handleDateChange('startDate', date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-12">Till:</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="justify-start">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            {filters.endDate ? format(filters.endDate, 'PPP', { locale: sv }) : 'Välj datum'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-background border shadow-md" align="start">
                          <Calendar
                            mode="single"
                            selected={filters.endDate}
                            onSelect={(date) => handleDateChange('endDate', date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">AI-genererad</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="ai-generated"
                        checked={filters.aiGenerated === true}
                        onCheckedChange={(checked) => 
                          onFiltersChange({
                            ...filters,
                            aiGenerated: checked ? true : undefined
                          })
                        }
                      />
                      <label 
                        htmlFor="ai-generated"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Endast AI-genererade poster
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}