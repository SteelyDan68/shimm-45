/**
 * 📊 STATS WIDGET - Statistik och KPI:er
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Target, CheckSquare, Users, Activity } from 'lucide-react';
import { WidgetProps } from '../types/dashboard-types';

const StatsWidget: React.FC<WidgetProps> = ({ widget, stats }) => {
  
  const getStatsForRole = () => {
    if (!stats) return [];
    
    // Client stats
    if (widget.permissions.includes('read-own-data')) {
      return [
        {
          label: 'Genomförda Pillars',
          value: stats.completedPillars || 0,
          max: 6,
          icon: Target,
          color: 'text-blue-600',
          trend: 'up'
        },
        {
          label: 'Aktiva Uppgifter',
          value: stats.activeTasks || 0,
          icon: CheckSquare,
          color: 'text-green-600',
          trend: 'stable'
        },
        {
          label: 'Total Progress',
          value: Math.round(stats.overallProgress || 0),
          max: 100,
          suffix: '%',
          icon: Activity,
          color: 'text-purple-600',
          trend: 'up'
        },
        {
          label: 'Velocity Score',
          value: stats.velocityScore || 0,
          max: 100,
          icon: TrendingUp,
          color: 'text-orange-600',
          trend: 'up'
        }
      ];
    }
    
    // Coach stats
    if (widget.permissions.includes('read-client-data')) {
      return [
        {
          label: 'Aktiva Klienter',
          value: stats.activeClients || 0,
          icon: Users,
          color: 'text-blue-600',
          trend: 'up'
        },
        {
          label: 'Genomsnittlig Progress',
          value: Math.round(stats.averageClientProgress || 0),
          max: 100,
          suffix: '%',
          icon: TrendingUp,
          color: 'text-green-600',
          trend: 'up'
        },
        {
          label: 'Slutförda Assessments',
          value: stats.completedAssessments || 0,
          icon: Target,
          color: 'text-purple-600',
          trend: 'stable'
        }
      ];
    }
    
    // Admin stats
    if (widget.permissions.includes('admin-all')) {
      return [
        {
          label: 'Totala Användare',
          value: stats.totalUsers || 0,
          icon: Users,
          color: 'text-blue-600',
          trend: 'up'
        },
        {
          label: 'Systemhälsa',
          value: stats.systemHealth || 0,
          max: 100,
          suffix: '%',
          icon: Activity,
          color: 'text-green-600',
          trend: 'up'
        },
        {
          label: 'Aktiva Klienter',
          value: stats.activeClients || 0,
          icon: Users,
          color: 'text-purple-600',
          trend: 'stable'
        }
      ];
    }
    
    return [];
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Minus;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const statsData = getStatsForRole();

  return (
    <div className="space-y-4">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        const TrendIcon = getTrendIcon(stat.trend);
        
        return (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-sm font-medium">{stat.label}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <span className={`text-lg font-bold ${stat.color}`}>
                  {stat.value}{stat.suffix || ''}
                  {stat.max && <span className="text-xs text-muted-foreground">/{stat.max}</span>}
                </span>
                <TrendIcon className={`w-3 h-3 ${getTrendColor(stat.trend)}`} />
              </div>
            </div>
            
            {stat.max && (
              <Progress 
                value={(stat.value / stat.max) * 100} 
                className="h-2"
              />
            )}
          </div>
        );
      })}
      
      {statsData.length === 0 && (
        <div className="text-center text-muted-foreground py-4">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Ingen statistik tillgänglig</p>
        </div>
      )}
    </div>
  );
};

export default StatsWidget;