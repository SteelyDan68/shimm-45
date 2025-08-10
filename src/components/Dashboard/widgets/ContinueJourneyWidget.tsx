/**
 * 🚀 CONTINUE JOURNEY WIDGET - "Fortsätt din utvecklingresa"
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, ArrowRight, Trophy, Target } from 'lucide-react';
import { WidgetProps } from '../types/dashboard-types';
import { useNavigate } from 'react-router-dom';

const ContinueJourneyWidget: React.FC<WidgetProps> = ({ widget, stats }) => {
  const navigate = useNavigate();
  
  const hasProgress = stats && stats.completedPillars && stats.completedPillars > 0;
  const progressPercentage = hasProgress ? Math.round((stats.completedPillars / 6) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-xl font-semibold">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Fortsätt din utvecklingresa
        </div>
        {hasProgress && (
          <p className="text-sm text-muted-foreground">
            Du har gjort bra framsteg - fortsätt så här!
          </p>
        )}
      </div>

      {hasProgress ? (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Dina framsteg</h4>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {stats.completedPillars}/6 områden
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Övergripande progress</span>
                <span className="font-medium">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <Button 
                size="sm"
                onClick={() => navigate('/my-assessments')}
                className="flex items-center gap-1"
              >
                <Target className="w-4 h-4" />
                Mina självskattningar
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/my-program')}
                className="flex items-center gap-1"
              >
                Mitt program
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-full flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <h4 className="font-medium mb-2">Redo att börja?</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Starta din utvecklingsresa idag
          </p>
          <Button 
            size="sm"
            onClick={() => navigate('/guided-assessment')}
            className="flex items-center gap-1"
          >
            <Target className="w-4 h-4" />
            Kom igång
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Card>
      )}
    </div>
  );
};

export { ContinueJourneyWidget };
export default ContinueJourneyWidget;