/**
 * 🎯 PILLAR PROGRESS WIDGET - Six Pillars utvecklingsöversikt
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, CheckCircle, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { WidgetProps } from '../types/dashboard-types';

const PillarProgressWidget: React.FC<WidgetProps> = ({ widget, stats, onAction }) => {
  
  // Mock pillar data - detta kommer senare från useUserPillars
  const pillars = [
    { key: 'self_care', name: 'Self Care', completed: true, score: 85 },
    { key: 'skills', name: 'Skills', completed: true, score: 78 },
    { key: 'talent', name: 'Talent', completed: false, inProgress: true, score: 45 },
    { key: 'brand', name: 'Brand', completed: false, inProgress: false, score: 0 },
    { key: 'economy', name: 'Economy', completed: false, inProgress: false, score: 0 },
    { key: 'open_track', name: 'Open Track', completed: false, inProgress: false, score: 0 }
  ];

  const completedCount = pillars.filter(p => p.completed).length;
  const totalProgress = (completedCount / pillars.length) * 100;

  const getPillarStatus = (pillar: any) => {
    if (pillar.completed) return { label: 'Slutförd', variant: 'default', icon: CheckCircle };
    if (pillar.inProgress) return { label: 'Pågår', variant: 'secondary', icon: Clock };
    return { label: 'Ej påbörjad', variant: 'outline', icon: Target };
  };

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
                  {pillar.score > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Score: {pillar.score}/100
                    </p>
                  )}
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