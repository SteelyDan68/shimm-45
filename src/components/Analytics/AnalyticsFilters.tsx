import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import type { AnalyticsFilters } from "@/hooks/useAnalytics";

interface AnalyticsFiltersProps {
  filters: AnalyticsFilters;
  onFiltersChange: (filters: AnalyticsFilters) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export function AnalyticsFilters({ 
  filters, 
  onFiltersChange, 
  onRefresh, 
  loading = false 
}: AnalyticsFiltersProps) {
  const handlePeriodChange = (period: AnalyticsFilters['period']) => {
    onFiltersChange({
      ...filters,
      period,
      startDate: undefined,
      endDate: undefined
    });
  };

  const handleCustomDateRange = (startDate?: Date, endDate?: Date) => {
    onFiltersChange({
      ...filters,
      period: '30d', // Reset to default when using custom range
      startDate,
      endDate
    });
  };

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Period:</span>
          <Select value={filters.period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dagar</SelectItem>
              <SelectItem value="30d">30 dagar</SelectItem>
              <SelectItem value="90d">90 dagar</SelectItem>
              <SelectItem value="1y">1 år</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Från:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-36 justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate ? (
                  format(filters.startDate, "d MMM yyyy", { locale: sv })
                ) : (
                  <span>Välj datum</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.startDate}
                onSelect={(date) => handleCustomDateRange(date, filters.endDate)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Till:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-36 justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate ? (
                  format(filters.endDate, "d MMM yyyy", { locale: sv })
                ) : (
                  <span>Välj datum</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.endDate}
                onSelect={(date) => handleCustomDateRange(filters.startDate, date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="ml-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Uppdatera
        </Button>
      </div>
    </Card>
  );
}