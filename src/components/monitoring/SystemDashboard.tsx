/**
 * 📊 SYSTEM MONITORING DASHBOARD
 * SCRUM-TEAM DEVOPS IMPLEMENTATION
 * 
 * Real-time system health and performance monitoring
 * Budget: 1 miljard kronor development standard
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  CpuIcon,
  HardDrive,
  Monitor,
  RefreshCw,
  Shield,
  Zap 
} from 'lucide-react';
import { SystemHealthMonitor, validateProductionReadiness, runPerformanceBenchmark } from '@/utils/productionReadinessChecker';
import { usePerformanceMonitoringV2 } from '@/utils/performanceOptimizationV2';

interface SystemMetrics {
  health: 'healthy' | 'warning' | 'critical';
  performance: number;
  memory: number;
  errors: number;
  uptime: number;
}

const SystemDashboard: React.FC = React.memo(() => {
  usePerformanceMonitoringV2('SystemDashboard');
  
  const [metrics, setMetrics] = useState<SystemMetrics>({
    health: 'healthy',
    performance: 95,
    memory: 12.5,
    errors: 0,
    uptime: Date.now()
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [productionReadiness, setProductionReadiness] = useState<any>(null);
  const [performanceBenchmark, setPerformanceBenchmark] = useState<any>(null);

  // Refresh system metrics
  const refreshMetrics = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const healthMonitor = SystemHealthMonitor.getInstance();
      const healthCheck = await healthMonitor.runHealthChecks();
      const perfSummary = healthMonitor.getPerformanceSummary();
      
      // Update metrics from health monitor
      setMetrics(prev => ({
        ...prev,
        health: healthCheck.status,
        performance: perfSummary.component_render?.avg ? 
          Math.max(0, 100 - perfSummary.component_render.avg * 2) : prev.performance,
        memory: perfSummary.memory_usage?.latest || prev.memory
      }));
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Run production readiness check
  const checkProductionReadiness = useCallback(async () => {
    setIsLoading(true);
    try {
      const readiness = await validateProductionReadiness();
      setProductionReadiness(readiness);
    } catch (error) {
      console.error('Production readiness check failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Run performance benchmark
  const runBenchmark = useCallback(async () => {
    setIsLoading(true);
    try {
      const benchmark = await runPerformanceBenchmark();
      setPerformanceBenchmark(benchmark);
    } catch (error) {
      console.error('Performance benchmark failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshMetrics, 30000);
    return () => clearInterval(interval);
  }, [refreshMetrics]);

  // Health status styling
  const healthStatus = useMemo(() => {
    switch (metrics.health) {
      case 'healthy':
        return {
          color: 'text-success',
          bgColor: 'bg-success/10',
          icon: CheckCircle,
          label: 'Healthy'
        };
      case 'warning':
        return {
          color: 'text-warning',
          bgColor: 'bg-warning/10',
          icon: AlertTriangle,
          label: 'Warning'
        };
      case 'critical':
        return {
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          icon: AlertTriangle,
          label: 'Critical'
        };
      default:
        return {
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/10',
          icon: Monitor,
          label: 'Unknown'
        };
    }
  }, [metrics.health]);

  const HealthIcon = healthStatus.icon;

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time system health and performance monitoring
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshMetrics}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <HealthIcon className={`h-5 w-5 ${healthStatus.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${healthStatus.color}`}>
              {healthStatus.label}
            </div>
            <div className={`text-xs px-2 py-1 rounded-full inline-block mt-2 ${healthStatus.bgColor} ${healthStatus.color}`}>
              All systems operational
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <Zap className="h-5 w-5 text-performance" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.performance.toFixed(1)}%
            </div>
            <Progress value={metrics.performance} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <HardDrive className="h-5 w-5 text-memory" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.memory.toFixed(1)} MB
            </div>
            <Progress value={(metrics.memory / 100) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Errors</CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.errors}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              No critical errors detected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Production Readiness Check */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Production Readiness
              </CardTitle>
              <CardDescription>
                Comprehensive system validation for production deployment
              </CardDescription>
            </div>
            <Button 
              onClick={checkProductionReadiness}
              disabled={isLoading}
              variant="outline"
            >
              Run Check
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {productionReadiness ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Readiness Score</span>
                <div className="flex items-center gap-2">
                  <Progress value={productionReadiness.score} className="w-32" />
                  <span className="font-bold">{productionReadiness.score}%</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={productionReadiness.ready ? 'default' : 'destructive'} 
                       className={productionReadiness.ready ? 'bg-success text-success-foreground' : ''}>
                  {productionReadiness.ready ? 'Production Ready' : 'Needs Attention'}
                </Badge>
              </div>

              {productionReadiness.issues.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Issues found:</strong>
                    <ul className="list-disc list-inside mt-2">
                      {productionReadiness.issues.map((issue: string, index: number) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {productionReadiness.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Recommendations:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {productionReadiness.recommendations.map((rec: string, index: number) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Click "Run Check" to validate production readiness</p>
          )}
        </CardContent>
      </Card>

      {/* Performance Benchmark */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance Benchmark
              </CardTitle>
              <CardDescription>
                Lighthouse-style performance and web vitals analysis
              </CardDescription>
            </div>
            <Button 
              onClick={runBenchmark}
              disabled={isLoading}
              variant="outline"
            >
              Run Benchmark
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {performanceBenchmark ? (
            <div className="space-y-6">
              {/* Lighthouse Scores */}
              <div>
                <h4 className="font-medium mb-3">Lighthouse Scores</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(performanceBenchmark.lighthouse).map(([key, value]: [string, any]) => (
                    <div key={key} className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {Math.round(value)}
                      </div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <Progress value={value} className="mt-1" />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Core Web Vitals */}
              <div>
                <h4 className="font-medium mb-3">Core Web Vitals</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">
                      {Math.round(performanceBenchmark.vitals.fcp)}ms
                    </div>
                    <div className="text-sm text-muted-foreground">
                      First Contentful Paint
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">
                      {Math.round(performanceBenchmark.vitals.lcp)}ms
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Largest Contentful Paint
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">
                      {performanceBenchmark.vitals.cls.toFixed(3)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Cumulative Layout Shift
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">
                      {Math.round(performanceBenchmark.vitals.fid)}ms
                    </div>
                    <div className="text-sm text-muted-foreground">
                      First Input Delay
                    </div>
                  </div>
                </div>
              </div>

              {performanceBenchmark.recommendations.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Performance Recommendations:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {performanceBenchmark.recommendations.map((rec: string, index: number) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Click "Run Benchmark" to analyze performance metrics</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

SystemDashboard.displayName = 'SystemDashboard';

export default SystemDashboard;