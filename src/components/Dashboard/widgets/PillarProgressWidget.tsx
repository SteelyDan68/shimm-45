/**
 * 🎯 PILLAR PROGRESS WIDGET - Six Pillars utvecklingsöversikt
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, CheckCircle, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { WidgetProps } from '../types/dashboard-types';
import { useUserPillars } from '@/hooks/useUserPillars';
import { useAuth } from '@/providers/UnifiedAuthProvider';

const PillarProgressWidget: React.FC<WidgetProps> = ({ widget, stats, onAction }) => {
  const { user } = useAuth();
  const { 
    getCompletedPillars, 
    getActivatedPillars,
    loading 
  } = useUserPillars(user?.id || '');

  const completedPillars = getCompletedPillars();
  const activatedPillars = getActivatedPillars();
  
  // All possible pillars in order
  const allPillars = [
    { key: 'self_care', name: 'Self Care' },
    { key: 'skills', name: 'Skills' },
    { key: 'talent', name: 'Talent' },
    { key: 'brand', name: 'Brand' },
    { key: 'economy', name: 'Economy' },
    { key: 'open_track', name: 'Open Track' }
  ];

  const getPillarData = () => {
    return allPillars.map(pillar => {
      const completed = completedPillars.some(cp => cp.pillar_key === pillar.key);
      const activated = activatedPillars.some(ap => ap.pillar_key === pillar.key);
      
      return {
        ...pillar,
        completed,
        inProgress: activated && !completed,
        available: activated || completed
      };
    });
  };

  const pillars = getPillarData();
  const completedCount = pillars.filter(p => p.completed).length;
  const totalProgress = (completedCount / pillars.length) * 100;

  const getPillarStatus = (pillar: any) => {
    if (pillar.completed) return { label: 'Slutförd', variant: 'default', icon: CheckCircle };
    if (pillar.inProgress) return { label: 'Pågår', variant: 'secondary', icon: Clock };
    return { label: 'Ej påbörjad', variant: 'outline', icon: Target };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-32 mx-auto mb-2" />
            <div className="h-8 bg-muted rounded w-20 mx-auto mb-2" />
            <div className="h-2 bg-muted rounded" />
          </div>
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Progress Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span className="font-semibold">Din Utvecklingsresa</span>
        </div>
        
        <div className="space-y-1">
          <div className="text-2xl font-bold text-purple-600">
            {completedCount}/6 Pillars
          </div>
          <Progress value={totalProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {Math.round(totalProgress)}% genomfört
          </p>
        </div>
      </div>

      {/* Pillars List */}
      <div className="space-y-2">
        {pillars.map((pillar) => {
          const status = getPillarStatus(pillar);
          const StatusIcon = status.icon;
          
          return (
            <div 
              key={pillar.key}
              className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <StatusIcon className={`w-4 h-4 ${
                  pillar.completed ? 'text-green-600' : 
                  pillar.inProgress ? 'text-blue-600' : 
                  'text-gray-400'
                }`} />
                
                <div>
                  <p className="font-medium text-sm">{pillar.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {pillar.completed ? 'Slutförd' : 
                     pillar.inProgress ? 'Pågår' :
                     pillar.available ? 'Tillgänglig' : 'Låst'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={status.variant as any} className="text-xs">
                  {status.label}
                </Badge>
                
                {!pillar.completed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAction?.(`start-pillar-${pillar.key}`)}
                    className="w-8 h-8 p-0"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          className="flex-1"
          onClick={() => onAction?.('view-pillars')}
        >
          <Target className="w-4 h-4 mr-2" />
          Se Alla Pillars
        </Button>
        
        {completedCount < pillars.length && (
          <Button 
            variant="outline"
            onClick={() => onAction?.('continue-journey')}
          >
            Fortsätt
          </Button>
        )}
      </div>
    </div>
  );
};

export default PillarProgressWidget;