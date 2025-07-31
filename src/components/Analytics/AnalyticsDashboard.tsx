import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AnalyticsFilters } from "./AnalyticsFilters";
import { AnalyticsSummary } from "./AnalyticsSummary";
import { BarrierTrendsChart } from "./BarrierTrendsChart";
import { TaskProgressChart } from "./TaskProgressChart";
import { VelocityTrendChart } from "./VelocityTrendChart";
import { SentimentTrendChart } from "./SentimentTrendChart";
import { ProblemAreasChart } from "./ProblemAreasChart";
import { FunctionalResourcesChart } from "./FunctionalResourcesChart";
import { PillarHeatmap } from "@/components/FivePillars/PillarHeatmap";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useFivePillarsModular } from "@/hooks/useFivePillarsModular";
import { useNavigate } from "react-router-dom";
import { HelpTooltip } from "@/components/HelpTooltip";
import { helpTexts } from "@/data/helpTexts";

interface AnalyticsDashboardProps {
  clientId?: string;
  showClientName?: boolean;
  onBack?: () => void;
}

export function AnalyticsDashboard({ clientId, showClientName = false, onBack }: AnalyticsDashboardProps) {
  const { data, loading, filters, setFilters, refreshData } = useAnalytics(clientId);
  const { generateHeatmapData } = useFivePillarsModular(clientId || '');
  const navigate = useNavigate();
  
  const heatmapData = generateHeatmapData();

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
      {/* Header with Navigation */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {onBack && (
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <CardTitle className="flex items-center gap-2">
                Detaljerad Analys
                <HelpTooltip content={helpTexts.analytics.overview} />
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/client-dashboard')}
              >
                Till Dashboard
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Pillar Analysis Integration */}
      {heatmapData && heatmapData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Five Pillars Status
              <HelpTooltip content={helpTexts.analytics.pillarAnalytics} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PillarHeatmap 
              heatmapData={heatmapData}
              title="Bedömningsresultat"
              showDetails={true}
              userId={clientId}
            />
          </CardContent>
        </Card>
      )}

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