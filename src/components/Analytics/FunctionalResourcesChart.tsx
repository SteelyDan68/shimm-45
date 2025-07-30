import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Activity, Brain, Users, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FunctionalResourceTrend } from "@/hooks/useAnalytics";

interface FunctionalResourcesChartProps {
  data: FunctionalResourceTrend[];
}

const chartConfig = {
  functionalAccess: {
    label: "Funktionstillgång (antal JA)",
    color: "hsl(var(--primary))",
  },
  subjectiveOpportunities: {
    label: "Subjektiva möjligheter (genomsnitt)",
    color: "hsl(var(--secondary))",
  },
  relationships: {
    label: "Relationsstöd",
    color: "hsl(var(--accent))",
  },
};

export function FunctionalResourcesChart({ data }: FunctionalResourcesChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Funktionella Resurser
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Inga resursdata tillgängliga</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get latest data point for summary
  const latestData = data[data.length - 1];
  const previousData = data.length > 1 ? data[data.length - 2] : null;

  // Calculate trends
  const functionalTrend = previousData 
    ? latestData.functionalAccessCount - previousData.functionalAccessCount
    : 0;
  
  const opportunitiesTrend = previousData 
    ? latestData.subjectiveOpportunitiesAvg - previousData.subjectiveOpportunitiesAvg
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-600" />
          Funktionella Resurser över tid
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Klientens tillgång till funktionella resurser och stöd
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Funktionstillgång */}
          <div className="p-3 border rounded-lg bg-orange-50/50 border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Funktionstillgång</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{latestData.functionalAccessCount}/4</span>
              {functionalTrend !== 0 && (
                <Badge variant={functionalTrend > 0 ? "default" : "destructive"} className="text-xs">
                  {functionalTrend > 0 ? '+' : ''}{functionalTrend}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Antal "JA" svar</p>
          </div>

          {/* Subjektiva möjligheter */}
          <div className="p-3 border rounded-lg bg-purple-50/50 border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Möjligheter</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{latestData.subjectiveOpportunitiesAvg.toFixed(1)}/5</span>
              {opportunitiesTrend !== 0 && (
                <Badge variant={opportunitiesTrend > 0 ? "default" : "destructive"} className="text-xs">
                  {opportunitiesTrend > 0 ? '+' : ''}{opportunitiesTrend.toFixed(1)}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Genomsnittligt värde</p>
          </div>

          {/* Relationsstöd */}
          <div className="p-3 border rounded-lg bg-green-50/50 border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Relationsstöd</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={latestData.hasRegularSupport ? "default" : "outline"}>
                {latestData.hasRegularSupport ? 'Finns' : 'Saknas'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {latestData.relationshipComments && latestData.relationshipComments.length > 0 
                ? `"${latestData.relationshipComments.slice(0, 30)}..."` 
                : 'Ingen kommentar'}
            </p>
          </div>
        </div>

        {/* Chart showing trends over time */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Utveckling över tid
          </h4>
          
          {/* Functional Access Count */}
          <div>
            <h5 className="text-sm font-medium mb-2 text-orange-600">🟠 Funktionstillgång (antal JA)</h5>
            <ChartContainer config={chartConfig} className="h-[150px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 4]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="functionalAccessCount" 
                    fill={chartConfig.functionalAccess.color}
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Subjective Opportunities Average */}
          <div>
            <h5 className="text-sm font-medium mb-2 text-purple-600">🟣 Subjektiva möjligheter (genomsnitt 1-5)</h5>
            <ChartContainer config={chartConfig} className="h-[150px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} domain={[1, 5]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="subjectiveOpportunitiesAvg" 
                    stroke={chartConfig.subjectiveOpportunities.color}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        {/* Recent relationship insights */}
        {latestData.relationshipComments && (
          <div className="p-3 border rounded-lg bg-green-50/30 border-green-200">
            <h5 className="text-sm font-medium mb-2 text-green-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              🟢 Senaste relationskommentar
            </h5>
            <p className="text-sm text-muted-foreground italic">"{latestData.relationshipComments}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}