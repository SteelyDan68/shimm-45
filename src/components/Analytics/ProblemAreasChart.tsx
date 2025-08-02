import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ProblemArea } from "@/hooks/useAnalytics";

interface ProblemAreasChartProps {
  data: ProblemArea[];
}

const chartConfig = {
  count: {
    label: "Antal förekomster",
    color: "hsl(var(--primary))",
  },
  percentage: {
    label: "Andel",
    color: "hsl(var(--secondary))",
  },
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--destructive))",
  "hsl(var(--warning))",
  "hsl(var(--success))",
  "hsl(var(--muted))",
];

export function ProblemAreasChart({ data }: ProblemAreasChartProps) {
  const totalIssues = data.reduce((sum, area) => sum + area.count, 0);
  const topArea = data[0];

  // Prepare data for pie chart
  const pieData = data.slice(0, 6).map((area, index) => ({
    ...area,
    fill: COLORS[index % COLORS.length]
  }));

  const getTrendIcon = (trend: ProblemArea['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-destructive" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-success" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Problemområden</CardTitle>
        <CardDescription>
          {totalIssues} problem registrerade • Vanligast: {topArea?.area || 'Inga data'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie chart */}
          <div>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    label={({ area, percentage }) => `${area}: ${percentage}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Detailed breakdown */}
          <div className="space-y-4">
            <h4 className="font-semibold">Detaljerad fördelning</h4>
            {data.slice(0, 8).map((area, index) => (
              <div key={area.area} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{area.area}</span>
                    {getTrendIcon(area.trend)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{area.count} st</span>
                    <span className="text-muted-foreground">({area.percentage}%)</span>
                  </div>
                </div>
                <Progress value={area.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart for top issues */}
        <div className="mt-6">
          <h4 className="font-semibold mb-4">Topp 5 problemområden</h4>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.slice(0, 5)} layout="horizontal">
                <XAxis type="number" />
                <YAxis dataKey="area" type="category" width={80} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}