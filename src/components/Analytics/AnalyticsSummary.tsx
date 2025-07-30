import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, CheckCircle, AlertTriangle, Target } from "lucide-react";
import type { AnalyticsData } from "@/hooks/useAnalytics";

interface AnalyticsSummaryProps {
  data: AnalyticsData;
}

export function AnalyticsSummary({ data }: AnalyticsSummaryProps) {
  const { summary } = data;
  
  const getVelocityRank = (score: number) => {
    return score >= 80 ? 'A' : score >= 60 ? 'B' : 'C';
  };

  const getVelocityColor = (score: number) => {
    return score >= 80 ? 'success' : score >= 60 ? 'warning' : 'destructive';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Task Completion Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Genomförandegrad
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.completionRate}%</div>
          <Progress value={summary.completionRate} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {summary.completedTasks} av {summary.totalTasks} uppgifter
          </p>
        </CardContent>
      </Card>

      {/* Current Velocity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Velocity-poäng
          </CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">{summary.currentVelocity}</div>
            <Badge variant={getVelocityColor(summary.currentVelocity) as any}>
              {getVelocityRank(summary.currentVelocity)}
            </Badge>
          </div>
          <Progress value={summary.currentVelocity} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Genomsnitt: {summary.averageVelocity}
          </p>
        </CardContent>
      </Card>

      {/* Most Common Barrier */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Största hindret
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-semibold truncate" title={summary.mostCommonBarrier}>
            {summary.mostCommonBarrier}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Vanligaste problemområdet
          </p>
        </CardContent>
      </Card>

      {/* Overall Trend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Utvecklingstrend
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">+12%</div>
          <p className="text-xs text-muted-foreground mt-2">
            Förbättring senaste månaden
          </p>
          <div className="flex gap-1 mt-2">
            <div className="w-2 h-2 rounded-full bg-success"></div>
            <div className="w-2 h-2 rounded-full bg-success"></div>
            <div className="w-2 h-2 rounded-full bg-success"></div>
            <div className="w-2 h-2 rounded-full bg-muted"></div>
            <div className="w-2 h-2 rounded-full bg-muted"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}