import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from "recharts";
import type { BarrierTrend } from "@/hooks/useAnalytics";

interface BarrierTrendsChartProps {
  data: BarrierTrend[];
}

const chartConfig = {
  count: {
    label: "Antal hinder",
    color: "hsl(var(--primary))",
  },
  tidsbrist: {
    label: "Tidsbrist",
    color: "hsl(var(--destructive))",
  },
  motivation: {
    label: "Motivation",
    color: "hsl(var(--warning))",
  },
  kunskap: {
    label: "Kunskapsbrist", 
    color: "hsl(var(--primary))",
  },
  resurser: {
    label: "Resursbrist",
    color: "hsl(var(--secondary))",
  },
};

export function BarrierTrendsChart({ data }: BarrierTrendsChartProps) {
  // Transform data for stacked bar chart
  const chartData = data.map(item => ({
    date: item.date,
    total: item.count,
    Tidsbrist: item.types['Tidsbrist'] || 0,
    Motivation: item.types['Motivation'] || 0,
    Kunskapsbrist: item.types['Kunskapsbrist'] || 0,
    Resursbrist: item.types['Resursbrist'] || 0,
    Övrigt: item.types['Övrigt'] || 0,
  }));

  const totalBarriers = data.reduce((sum, item) => sum + item.count, 0);
  const averageDaily = data.length > 0 ? (totalBarriers / data.length).toFixed(1) : '0';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hinder över tid</CardTitle>
        <CardDescription>
          Totalt {totalBarriers} hinder registrerade • Genomsnitt {averageDaily} per dag
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="Tidsbrist" stackId="barriers" fill="hsl(var(--destructive))" />
              <Bar dataKey="Motivation" stackId="barriers" fill="hsl(var(--warning))" />
              <Bar dataKey="Kunskapsbrist" stackId="barriers" fill="hsl(var(--primary))" />
              <Bar dataKey="Resursbrist" stackId="barriers" fill="hsl(var(--secondary))" />
              <Bar dataKey="Övrigt" stackId="barriers" fill="hsl(var(--muted))" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Trend line overlay */}
        <div className="mt-4">
          <ChartContainer config={chartConfig} className="h-[150px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis 
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}