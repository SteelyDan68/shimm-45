/**
 * 🏛️ PILLAR STATUS WIDGET - "Din utvecklingsresa" med pillar status
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, ArrowRight, Target } from 'lucide-react';
import { WidgetProps } from '../types/dashboard-types';
import { useNavigate } from 'react-router-dom';

const PillarStatusWidget: React.FC<WidgetProps> = ({ widget, stats }) => {
  const navigate = useNavigate();
  
  // Mock pillar data - i produktion skulle detta komma från stats eller separat hook
  const pillars = [
    { id: 'physical', name: 'Fysisk hälsa', completed: true },
    { id: 'mental', name: 'Mental hälsa', completed: true },
    { id: 'relationships', name: 'Relationer', completed: false },
    { id: 'work', name: 'Arbete & karriär', completed: false },
    { id: 'personal', name: 'Personlig utveckling', completed: false },
    { id: 'purpose', name: 'Mening & syfte', completed: false }
  ];

  const completedCount = stats?.completedPillars || pillars.filter(p => p.completed).length;
  const progressPercentage = Math.round((completedCount / 6) * 100);

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-xl font-semibold">
          <Target className="w-5 h-5 text-blue-600" />
          Din utvecklingsresa
        </div>
        <p className="text-sm text-muted-foreground">
          Sex viktiga områden för ett balanserat liv
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Utvecklingsområden</h4>
            <Badge variant="secondary">
              {completedCount}/6 utforskade
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Övergripande framsteg</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="space-y-2">
            {pillars.map((pillar) => (
              <div key={pillar.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  {pillar.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className={`text-sm ${pillar.completed ? 'font-medium' : 'text-muted-foreground'}`}>
                    {pillar.name}
                  </span>
                </div>
                {!pillar.completed && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => navigate(`/six-pillars/${pillar.id}`)}
                    className="text-xs"
                  >
                    Utforska
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 border-t">
            <Button 
              onClick={() => navigate('/six-pillars')}
              className="w-full flex items-center gap-2"
              size="sm"
            >
              <Target className="w-4 h-4" />
              Se alla utvecklingsområden
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export { PillarStatusWidget };
export default PillarStatusWidget;