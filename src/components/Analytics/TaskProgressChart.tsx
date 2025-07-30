import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import type { TaskProgress } from "@/hooks/useAnalytics";

interface TaskProgressChartProps {
  data: TaskProgress[];
}

const chartConfig = {
  completed: {
    label: "Genomförda",
    color: "hsl(var(--success))",
  },
  created: {
    label: "Skapade",
    color: "hsl(var(--primary))",
  },
  pending: {
    label: "Väntande",
    color: "hsl(var(--warning))",
  },
};

export function TaskProgressChart({ data }: TaskProgressChartProps) {
  const totalCompleted = data.reduce((sum, item) => sum + item.completed, 0);
  const totalCreated = data.reduce((sum, item) => sum + item.created, 0);
  const completionRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;

  // Calculate cumulative data for area chart
  const cumulativeData = data.reduce((acc, item, index) => {
    const previous = acc[index - 1] || { cumulativeCompleted: 0, cumulativeCreated: 0 };
    acc.push({
      date: item.date,
      completed: item.completed,
      created: item.created,
      pending: item.pending,
      cumulativeCompleted: previous.cumulativeCompleted + item.completed,
      cumulativeCreated: previous.cumulativeCreated + item.created,
    });
    return acc;
  }, [] as any[]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uppgiftsframsteg</CardTitle>
        <CardDescription>
          {completionRate}% genomförandegrad • {totalCompleted} av {totalCreated} uppgifter slutförda
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulativeData}>
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="cumulativeCreated"
                stackId="1"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="cumulativeCompleted"
                stackId="2"
                stroke="hsl(var(--success))"
                fill="hsl(var(--success))"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Daily breakdown */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 rounded-lg bg-success/10">
            <div className="text-2xl font-bold text-success">{totalCompleted}</div>
            <div className="text-sm text-muted-foreground">Genomförda</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/10">
            <div className="text-2xl font-bold text-primary">{totalCreated}</div>
            <div className="text-sm text-muted-foreground">Skapade</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-warning/10">
            <div className="text-2xl font-bold text-warning">
              {totalCreated - totalCompleted}
            </div>
            <div className="text-sm text-muted-foreground">Kvarvarande</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}