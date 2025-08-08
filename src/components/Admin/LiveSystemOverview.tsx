import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Zap,
  Cpu,
  HardDrive
} from 'lucide-react';

export const LiveSystemOverview: React.FC = () => {
  const { metrics, performanceMetrics, loading, error, refreshMetrics } = useSystemMetrics();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-pulse" />
            Live Systemöversikt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                <div className="h-6 bg-muted rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Live Systemöversikt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <p>Kunde inte ladda systemstatistik</p>
            <button 
              onClick={refreshMetrics}
              className="mt-2 text-primary hover:underline"
            >
              Försök igen
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'good':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'good':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'warning':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main System Health Card */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Systemöversikt
            </div>
            <Badge variant="outline" className="text-xs">
              Uppdaterad: {new Date(metrics.lastUpdated).toLocaleTimeString('sv-SE')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {metrics.healthScore}%
              </div>
              <p className="text-sm text-muted-foreground">Systemhälsa</p>
              <Progress value={metrics.healthScore} className="mt-2" />
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                <Clock className="h-5 w-5 text-blue-600" />
                {metrics.responseTime}ms
              </div>
              <p className="text-sm text-muted-foreground">Svarstid</p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                <Users className="h-5 w-5 text-green-600" />
                {metrics.activeConnections}
              </div>
              <p className="text-sm text-muted-foreground">Aktiva Sessioner</p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                {metrics.uptime}%
              </div>
              <p className="text-sm text-muted-foreground">Uptime</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Prestanda Mätningar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {performanceMetrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(metric.status)}
                  <span className="text-sm font-medium">{metric.name}</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={getStatusColor(metric.status)}
                >
                  {metric.value}{metric.unit}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Resursanvändning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>CPU Användning</span>
                <span>{Math.round(metrics.cpuUsage)}%</span>
              </div>
              <Progress value={metrics.cpuUsage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Minnesanvändning</span>
                <span>{Math.round(metrics.memoryUsage)}%</span>
              </div>
              <Progress value={metrics.memoryUsage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Felfrekvens</span>
                <span className={metrics.errorRate > 1 ? 'text-red-600' : 'text-green-600'}>
                  {metrics.errorRate}%
                </span>
              </div>
              <Progress 
                value={Math.min(metrics.errorRate * 10, 100)} 
                className="h-2"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                Totala Förfrågningar (senaste timmen)
              </span>
              <Badge variant="outline">
                {metrics.totalRequests.toLocaleString()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};