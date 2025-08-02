import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

// Standardized Dashboard Metric Card
export interface DashboardMetric {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  progress?: {
    value: number;
    max: number;
  };
}

export const DashboardMetricCard: React.FC<{ metric: DashboardMetric }> = ({ metric }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    gray: 'bg-gray-50 text-gray-600'
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
        <div className={`p-2 rounded-lg ${colorMap[metric.color]}`}>
          <metric.icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{metric.value}</div>
        {metric.subtitle && (
          <p className="text-xs text-muted-foreground">{metric.subtitle}</p>
        )}
        {metric.trend && (
          <div className={`text-xs flex items-center gap-1 mt-1 ${
            metric.trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <span>{metric.trend.isPositive ? '↗' : '↘'}</span>
            <span>{Math.abs(metric.trend.value)}% {metric.trend.period}</span>
          </div>
        )}
        {metric.progress && (
          <div className="mt-2">
            <Progress 
              value={(metric.progress.value / metric.progress.max) * 100} 
              className="h-2" 
            />
            <div className="text-xs text-muted-foreground mt-1">
              {metric.progress.value} av {metric.progress.max}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Standardized Dashboard Welcome Header
export interface DashboardWelcome {
  title: string;
  subtitle: string;
  userName: string;
  icon: React.ComponentType<{ className?: string }>;
  stats?: {
    primary: { value: string | number; label: string };
    secondary?: { value: string | number; label: string };
  };
  actions?: Array<{
    title: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
    icon?: React.ComponentType<{ className?: string }>;
  }>;
}

export const DashboardWelcomeHeader: React.FC<{ config: DashboardWelcome }> = ({ config }) => {
  return (
    <Card className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-purple-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-full shadow-sm">
              <config.icon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {config.title}, {config.userName}!
              </CardTitle>
              <p className="text-muted-foreground">{config.subtitle}</p>
            </div>
          </div>
          
          {config.stats && (
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {config.stats.primary.value}
              </div>
              <p className="text-sm text-muted-foreground">
                {config.stats.primary.label}
              </p>
              {config.stats.secondary && (
                <Badge variant="outline" className="mt-1">
                  {config.stats.secondary.value} {config.stats.secondary.label}
                </Badge>
              )}
            </div>
          )}
        </div>
        
        {config.actions && (
          <div className="flex gap-2 mt-4">
            {config.actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'default'}
                onClick={action.onClick}
                className="flex items-center gap-2"
              >
                {action.icon && <action.icon className="h-4 w-4" />}
                {action.title}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>
    </Card>
  );
};

// Standardized Quick Actions Grid
export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
  priority: 'high' | 'medium' | 'low';
  badge?: string;
}

export const QuickActionsGrid: React.FC<{ 
  actions: QuickAction[];
  title: string;
  subtitle?: string;
}> = ({ actions, title, subtitle }) => {
  const colorMap = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500'
  };

  const sortedActions = actions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedActions.map((action) => (
            <Card 
              key={action.id} 
              className="hover:shadow-md transition-shadow cursor-pointer relative" 
              onClick={action.onClick}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${colorMap[action.color]} text-white`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{action.title}</h4>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  {action.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {action.badge}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Standardized Activity Feed
export interface ActivityItem {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  description?: string;
  timestamp: string;
  icon: React.ComponentType<{ className?: string }>;
  metadata?: Record<string, any>;
}

export const ActivityFeed: React.FC<{ 
  activities: ActivityItem[];
  title: string;
  maxItems?: number;
}> = ({ activities, title, maxItems = 5 }) => {
  const typeColorMap = {
    success: 'bg-green-50 text-green-600',
    warning: 'bg-yellow-50 text-yellow-600',
    info: 'bg-blue-50 text-blue-600',
    error: 'bg-red-50 text-red-600'
  };

  const displayItems = activities.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Ingen aktivitet än</p>
          </div>
        ) : (
          displayItems.map((activity) => (
            <div key={activity.id} className={`flex items-center justify-between p-3 rounded ${typeColorMap[activity.type]}`}>
              <div className="flex items-center gap-2">
                <activity.icon className="h-4 w-4" />
                <div>
                  <span className="text-sm font-medium">{activity.title}</span>
                  {activity.description && (
                    <p className="text-xs opacity-80">{activity.description}</p>
                  )}
                </div>
              </div>
              <span className="text-xs opacity-70">{activity.timestamp}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};