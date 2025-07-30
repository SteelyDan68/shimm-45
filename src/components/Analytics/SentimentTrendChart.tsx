import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts";
import type { SentimentTrend } from "@/hooks/useAnalytics";

interface SentimentTrendChartProps {
  data: SentimentTrend[];
}

const chartConfig = {
  positive: {
    label: "Positiv",
    color: "hsl(var(--success))",
  },
  neutral: {
    label: "Neutral",
    color: "hsl(var(--muted))",
  },
  negative: {
    label: "Negativ",
    color: "hsl(var(--destructive))",
  },
  average: {
    label: "Genomsnittlig sentiment",
    color: "hsl(var(--primary))",
  },
};

export function SentimentTrendChart({ data }: SentimentTrendChartProps) {
  const currentSentiment = data[data.length - 1]?.average || 0;
  const averageSentiment = data.length > 0 ? 
    Math.round(data.reduce((sum, point) => sum + point.average, 0) / data.length) : 0;
  
  const sentimentLabel = currentSentiment > 20 ? 'Positiv' : 
                        currentSentiment > -20 ? 'Neutral' : 'Negativ';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sentimenttrend</CardTitle>
        <CardDescription>
          Aktuell sentiment: {sentimentLabel} ({currentSentiment > 0 ? '+' : ''}{currentSentiment}) • 
          Genomsnitt: {averageSentiment > 0 ? '+' : ''}{averageSentiment}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Stacked area chart for sentiment distribution */}
        <ChartContainer config={chartConfig} className="h-[200px] w-full mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
              />
              <YAxis domain={[0, 100]} />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value: number, name) => [`${value}%`, name]}
              />
              <Area
                type="monotone"
                dataKey="positive"
                stackId="1"
                stroke="hsl(var(--success))"
                fill="hsl(var(--success))"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="neutral"
                stackId="1"
                stroke="hsl(var(--muted))"
                fill="hsl(var(--muted))"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="negative"
                stackId="1"
                stroke="hsl(var(--destructive))"
                fill="hsl(var(--destructive))"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Average sentiment line */}
        <ChartContainer config={chartConfig} className="h-[150px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
              />
              <YAxis domain={[-50, 50]} />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value: number) => [`${value > 0 ? '+' : ''}${value}`, 'Sentiment']}
              />
              <Line 
                type="monotone" 
                dataKey="average" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Current sentiment breakdown */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center p-3 rounded-lg bg-success/10">
            <div className="text-xl font-bold text-success">
              {data[data.length - 1]?.positive || 0}%
            </div>
            <div className="text-sm text-muted-foreground">Positiv</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/20">
            <div className="text-xl font-bold text-muted-foreground">
              {data[data.length - 1]?.neutral || 0}%
            </div>
            <div className="text-sm text-muted-foreground">Neutral</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-destructive/10">
            <div className="text-xl font-bold text-destructive">
              {data[data.length - 1]?.negative || 0}%
            </div>
            <div className="text-sm text-muted-foreground">Negativ</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}