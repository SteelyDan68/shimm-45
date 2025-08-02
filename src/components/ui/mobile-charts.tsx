import React, { useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BarChart3,
  PieChart,
  Activity,
  Target
} from 'lucide-react';

interface MobileChartData {
  label: string;
  value: number;
  percentage?: number;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
  icon?: React.ReactNode;
  subtitle?: string;
}

interface ResponsiveChartProps {
  data: MobileChartData[];
  title?: string;
  type?: 'bar' | 'pie' | 'line' | 'progress';
  showPercentages?: boolean;
  className?: string;
}

const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />;
    case 'down': return <TrendingDown className="h-3 w-3 text-red-600" />;
    default: return <Minus className="h-3 w-3 text-muted-foreground" />;
  }
};

const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up': return 'text-green-600';
    case 'down': return 'text-red-600';
    default: return 'text-muted-foreground';
  }
};

// Mobile-optimized chart component
export const ResponsiveChart: React.FC<ResponsiveChartProps> = ({
  data,
  title,
  type = 'bar',
  showPercentages = true,
  className
}) => {
  const isMobile = useIsMobile();
  
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value)), [data]);
  
  const renderMobileChart = () => {
    switch (type) {
      case 'progress':
        return (
          <div className="space-y-4">
            {data.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold">{item.value}</span>
                    {item.trend && getTrendIcon(item.trend)}
                  </div>
                </div>
                <Progress 
                  value={item.percentage || (item.value / maxValue) * 100} 
                  className="h-2"
                />
                {item.subtitle && (
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                )}
              </div>
            ))}
          </div>
        );
        
      case 'pie':
        return (
          <div className="grid grid-cols-1 gap-3">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color || `hsl(${index * 60}, 70%, 50%)` }}
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{item.value}</div>
                  {showPercentages && item.percentage && (
                    <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
        
      default: // bar chart
        return (
          <div className="space-y-3">
            {data.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold">{item.value}</span>
                    {item.trend && (
                      <span className={getTrendColor(item.trend)}>
                        {getTrendIcon(item.trend)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(item.value / maxValue) * 100}%`,
                      backgroundColor: item.color || `hsl(${index * 60}, 70%, 50%)`
                    }}
                  />
                </div>
                {item.subtitle && (
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                )}
              </div>
            ))}
          </div>
        );
    }
  };

  if (isMobile) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {title}
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="pt-0">
          {renderMobileChart()}
        </CardContent>
      </Card>
    );
  }

  // Desktop version - return children or render desktop chart
  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {renderMobileChart()}
      </CardContent>
    </Card>
  );
};

// Gauge component for mobile
interface MobileGaugeProps {
  value: number;
  max: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  showValue?: boolean;
  className?: string;
}

export const MobileGauge: React.FC<MobileGaugeProps> = ({
  value,
  max,
  label,
  size = 'md',
  color = 'hsl(var(--primary))',
  showValue = true,
  className
}) => {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24', 
    lg: 'w-32 h-32'
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 100 100"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke={color}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {value} av {max}
        </p>
      </div>
    </div>
  );
};

// Stats card optimized for mobile
interface MobileStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  icon?: React.ReactNode;
  color?: string;
  className?: string;
}

export const MobileStatsCard: React.FC<MobileStatsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color,
  className
}) => {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground truncate">
              {title}
            </p>
            <p className="text-lg font-bold mt-1">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {icon && (
              <div className="p-2 rounded-md bg-primary/10 text-primary">
                {icon}
              </div>
            )}
            {trend && (
              <div className={cn("flex items-center", getTrendColor(trend))}>
                {getTrendIcon(trend)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};