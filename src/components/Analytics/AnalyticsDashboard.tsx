import { AnalyticsFilters } from "./AnalyticsFilters";
import { AnalyticsSummary } from "./AnalyticsSummary";
import { BarrierTrendsChart } from "./BarrierTrendsChart";
import { TaskProgressChart } from "./TaskProgressChart";
import { VelocityTrendChart } from "./VelocityTrendChart";
import { SentimentTrendChart } from "./SentimentTrendChart";
import { ProblemAreasChart } from "./ProblemAreasChart";
import { FunctionalResourcesChart } from "./FunctionalResourcesChart";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics } from "@/hooks/useAnalytics";

interface AnalyticsDashboardProps {
  clientId?: string;
  showClientName?: boolean;
}

export function AnalyticsDashboard({ clientId, showClientName = false }: AnalyticsDashboardProps) {
  const { data, loading, filters, setFilters, refreshData } = useAnalytics(clientId);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-lg font-semibold">Inga analysdata tillgängliga</div>
          <p className="text-muted-foreground">Ingen data att visa för den valda perioden</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <AnalyticsFilters
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={refreshData}
        loading={loading}
      />

      {/* Summary Cards */}
      <AnalyticsSummary data={data} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Progress */}
        <TaskProgressChart data={data.taskProgress} />
        
        {/* Velocity Trend */}
        <VelocityTrendChart data={data.velocityTrends} />
        
        {/* Barrier Trends */}
        <BarrierTrendsChart data={data.barrierTrends} />
        
        {/* Functional Resources - New Chart */}
        <FunctionalResourcesChart data={data.functionalResources} />
      </div>

      {/* Full Width Charts */}
      <div className="space-y-6">
        {/* Sentiment Trends */}
        <SentimentTrendChart data={data.sentimentTrends} />
        
        {/* Problem Areas - Full Width */}
        <ProblemAreasChart data={data.problemAreas} />
      </div>
    </div>
  );
}