import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";
import { Badge } from "@/components/ui/badge";
import type { VelocityPoint } from "@/hooks/useAnalytics";

interface VelocityTrendChartProps {
  data: VelocityPoint[];
}

const chartConfig = {
  score: {
    label: "Velocity Score",
    color: "hsl(var(--primary))",
  },
};

const getRankColor = (rank: string) => {
  switch (rank) {
    case 'A': return 'success';
    case 'B': return 'warning';
    case 'C': return 'destructive';
    default: return 'secondary';
  }
};

export function VelocityTrendChart({ data }: VelocityTrendChartProps) {
  const currentScore = data[data.length - 1]?.score || 0;
  const currentRank = data[data.length - 1]?.rank || 0;
  const averageScore = data.length > 0 ? Math.round(data.reduce((sum, point) => sum + point.score, 0) / data.length) : 0;
  
  // Calculate trend direction
  const firstScore = data[0]?.score || 0;
  const trendDirection = currentScore > firstScore ? 'Uppåtgående' : 
                        currentScore < firstScore ? 'Nedåtgående' : 'Stabil';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Velocity-trend 
          <Badge variant={getRankColor(currentRank.toString()) as any}>
            {currentRank >= 80 ? 'A' : currentRank >= 60 ? 'B' : 'C'}-klient
          </Badge>
        </CardTitle>
        <CardDescription>
          Nuvarande: {currentScore} poäng • Genomsnitt: {averageScore} • Trend: {trendDirection}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
              />
              <YAxis domain={[0, 100]} />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                labelFormatter={(value) => new Date(value).toLocaleDateString('sv-SE')}
                formatter={(value: number, name) => [
                  `${value} poäng (${value >= 80 ? 'A' : value >= 60 ? 'B' : 'C'})`, 
                  'Velocity Score'
                ]}
              />
              
              {/* Reference lines for rank boundaries */}
              <ReferenceLine y={80} stroke="hsl(var(--success))" strokeDasharray="5 5" />
              <ReferenceLine y={60} stroke="hsl(var(--warning))" strokeDasharray="5 5" />
              
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Rank indicators */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success"></div>
              <span className="text-sm">A-klient (80-100)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning"></div>
              <span className="text-sm">B-klient (60-79)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive"></div>
              <span className="text-sm">C-klient (0-59)</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold">{currentScore}</div>
            <div className="text-sm text-muted-foreground">Aktuell poäng</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}