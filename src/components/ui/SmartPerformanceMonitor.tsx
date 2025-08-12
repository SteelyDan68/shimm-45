/**
 * 🎯 SMART PERFORMANCE COMPONENT
 * Övervakar och optimerar prestanda för hela applikationen
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdaptivePerformance } from '@/hooks/useAdvancedUX';
import { Activity, Zap, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { logger } from '@/utils/productionLogger';

export const SmartPerformanceMonitor: React.FC = () => {
  const { performanceMetrics, getOptimizationSuggestions } = useAdaptivePerformance();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Visa bara om prestanda är dålig eller för admins
    const shouldShow = !performanceMetrics.isOptimized || 
                      localStorage.getItem('show-performance-monitor') === 'true';
    setIsVisible(shouldShow);
  }, [performanceMetrics.isOptimized]);

  if (!isVisible) return null;

  const suggestions = getOptimizationSuggestions();

  const getPerformanceColor = () => {
    if (performanceMetrics.fps > 55) return 'text-green-600';
    if (performanceMetrics.fps > 45) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = () => {
    if (performanceMetrics.isOptimized) return CheckCircle;
    if (performanceMetrics.fps > 45) return TrendingUp;
    return AlertTriangle;
  };

  const PerformanceIcon = getPerformanceIcon();

  return (
    <Card className="border-yellow-200 bg-yellow-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4" />
          Smart Performance Monitor
          <Badge variant={performanceMetrics.isOptimized ? "default" : "destructive"}>
            {performanceMetrics.isOptimized ? 'Optimized' : 'Needs Attention'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className={`text-lg font-bold ${getPerformanceColor()}`}>
              {Math.round(performanceMetrics.fps)}
            </div>
            <div className="text-xs text-muted-foreground">FPS</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              {Math.round(performanceMetrics.renderTime)}ms
            </div>
            <div className="text-xs text-muted-foreground">Render Time</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              {Math.round(performanceMetrics.memoryUsage / 1024 / 1024)}MB
            </div>
            <div className="text-xs text-muted-foreground">Memory</div>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Optimization Suggestions:</div>
            {suggestions.map((suggestion, index) => (
              <div key={index} className="text-xs bg-yellow-100 p-2 rounded">
                <Zap className="h-3 w-3 inline mr-1" />
                {suggestion}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => {
              logger.info('Performance optimization triggered', performanceMetrics);
              // Här skulle man trigga optimeringar
            }}
          >
            Optimize Now
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setIsVisible(false)}
          >
            Hide
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};