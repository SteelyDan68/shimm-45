/**
 * 🔥 ENTERPRISE-GRADE DYNAMIC WIDGET RENDERER
 * Renderar widgets dynamiskt baserat på typ och konfiguration
 */

import React, { Suspense, lazy } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Eye, EyeOff, Loader2 } from 'lucide-react';
import { WidgetProps } from '../types/dashboard-types';
import { cn } from '@/lib/utils';

// 🚀 LAZY LOADED WIDGETS för optimal prestanda
const WelcomeWidget = lazy(() => import('../widgets/WelcomeWidget'));
const StatsWidget = lazy(() => import('../widgets/StatsWidget'));
const PillarProgressWidget = lazy(() => import('../widgets/PillarProgressWidget'));
const TasksWidget = lazy(() => import('../widgets/TasksWidget'));
const CalendarWidget = lazy(() => import('../widgets/CalendarWidget'));
const ClientAnalyticsWidget = lazy(() => import('../widgets/ClientAnalyticsWidget'));
const ClientOverviewWidget = lazy(() => import('../widgets/ClientOverviewWidget'));
const CoachingToolsWidget = lazy(() => import('../widgets/CoachingToolsWidget'));
const ActivityFeedWidget = lazy(() => import('../widgets/ActivityFeedWidget'));
const SystemHealthWidget = lazy(() => import('../widgets/SystemHealthWidget'));
const UserManagementWidget = lazy(() => import('../widgets/UserManagementWidget'));

/**
 * 🎯 WIDGET LOADER MAPPING
 */
const WIDGET_COMPONENTS = {
  'welcome': WelcomeWidget,
  'stats': StatsWidget,
  'pillar-progress': PillarProgressWidget,
  'tasks': TasksWidget,
  'calendar': CalendarWidget,
  'client-analytics': ClientAnalyticsWidget,
  'client-overview': ClientOverviewWidget,
  'coaching-tools': CoachingToolsWidget,
  'activity-feed': ActivityFeedWidget,
  'system-health': SystemHealthWidget,
  'user-management': UserManagementWidget,
  'analytics': StatsWidget // Fallback för nu
};

/**
 * 📐 WIDGET GRID SPAN CALCULATOR
 */
const getGridSpanClasses = (span: number = 1) => {
  const spanClasses = {
    1: 'col-span-1',
    2: 'col-span-1 sm:col-span-2',
    3: 'col-span-1 sm:col-span-2 lg:col-span-3',
    4: 'col-span-1 sm:col-span-2 lg:col-span-4',
    6: 'col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-6',
    8: 'col-span-1 sm:col-span-2 lg:col-span-4 xl:col-span-8',
    12: 'col-span-1 sm:col-span-2 lg:col-span-4 xl:col-span-6 2xl:col-span-12'
  };
  
  return spanClasses[span as keyof typeof spanClasses] || spanClasses[1];
};

/**
 * 🔄 WIDGET LOADING FALLBACK
 */
const WidgetSkeleton: React.FC<{ widget: WidgetProps['widget'] }> = ({ widget }) => (
  <Card className={cn("animate-pulse", getGridSpanClasses(widget.span))}>
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-muted rounded"></div>
          <div className="w-24 h-4 bg-muted rounded"></div>
        </div>
        <div className="w-6 h-6 bg-muted rounded"></div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="w-full h-4 bg-muted rounded"></div>
        <div className="w-3/4 h-4 bg-muted rounded"></div>
        <div className="w-1/2 h-4 bg-muted rounded"></div>
      </div>
    </CardContent>
  </Card>
);

/**
 * ⚠️ WIDGET ERROR FALLBACK
 */
const WidgetError: React.FC<{ widget: WidgetProps['widget']; error?: string }> = ({ 
  widget, 
  error = "Widget kunde inte laddas" 
}) => (
  <Card className={cn("border-red-200", getGridSpanClasses(widget.span))}>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-red-600">
        {widget.icon && <widget.icon className="w-5 h-5" />}
        {widget.title}
        <Badge variant="destructive" className="text-xs">Error</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-red-600 mb-2">{error}</p>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => window.location.reload()}
      >
        Försök igen
      </Button>
    </CardContent>
  </Card>
);

/**
 * 🎯 HUVUD DYNAMIC WIDGET COMPONENT
 */
export const DynamicWidget: React.FC<WidgetProps> = (props) => {
  const { widget, stats, actions, onAction, onConfigChange } = props;
  
  // Hämta widget-komponenten
  const WidgetComponent = WIDGET_COMPONENTS[widget.type];
  
  if (!WidgetComponent) {
    return (
      <WidgetError 
        widget={widget} 
        error={`Widget-typ "${widget.type}" stöds inte ännu`}
      />
    );
  }

  // Widget control handlers
  const handleToggleVisibility = () => {
    if (onConfigChange) {
      onConfigChange({ isVisible: !widget.isVisible });
    }
  };

  const handleOpenSettings = () => {
    if (onAction) {
      onAction(`configure-${widget.id}`);
    }
  };

  return (
    <div className={getGridSpanClasses(widget.span)}>
      <Card 
        className={cn(
          "h-full transition-all duration-200",
          widget.minHeight && `min-h-[${widget.minHeight}px]`,
          !widget.isVisible && "opacity-50"
        )}
      >
        {/* Widget Header med kontroller */}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {widget.icon && <widget.icon className="w-5 h-5" />}
              {widget.title}
              {widget.type === 'stats' && stats && (
                <Badge variant="secondary" className="text-xs">
                  Live
                </Badge>
              )}
            </CardTitle>
            
            {/* Widget Controls */}
            <div className="flex items-center gap-1">
              {widget.isConfigurable && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenSettings}
                  className="w-8 h-8 p-0"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleVisibility}
                className="w-8 h-8 p-0"
              >
                {widget.isVisible ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          {widget.description && (
            <p className="text-sm text-muted-foreground">{widget.description}</p>
          )}
        </CardHeader>

        {/* Widget Content */}
        <CardContent className="pt-0">
          <Suspense fallback={<WidgetSkeleton widget={widget} />}>
            <WidgetComponent {...props} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
};