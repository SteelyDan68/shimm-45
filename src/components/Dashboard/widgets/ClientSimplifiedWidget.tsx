/**
 * 🎯 SIMPLIFIED CLIENT WIDGET - För nya användare med progressive disclosure
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronDown, 
  ChevronUp, 
  Target, 
  CheckCircle2, 
  ArrowRight,
  Eye,
  Brain,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { WidgetProps } from '../types/dashboard-types';

const ClientSimplifiedWidget: React.FC<WidgetProps> = ({ widget, stats }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const hasCompletedAssessments = stats && stats.completedPillars && stats.completedPillars > 0;
  const isNewUser = !hasCompletedAssessments;
  
  // Progressive disclosure - visa bara vad som är relevant för användarens nivå
  const getNextSteps = () => {
    if (isNewUser) {
      return [
        {
          id: 'first-assessment',
          title: 'Gör din första assessment',
          description: 'Stefan behöver förstå dig för att ge personliga rekommendationer',
          action: 'Starta assessment',
          href: '/guided-assessment',
          priority: 'high',
          icon: Target
        }
      ];
    }
    
    const steps = [];
    
    if (stats.completedPillars < 3) {
      steps.push({
        id: 'continue-assessments',
        title: 'Fortsätt med assessments',
        description: 'Ju fler områden du utforskar, desto bättre kan Stefan hjälpa dig',
        action: 'Fortsätt assessment',
        href: '/guided-assessment',
        priority: 'high',
        icon: Target
      });
    }
    
    steps.push({
      id: 'view-analyses',
      title: 'Se dina analyser',
      description: 'Stefan har analyserat dina svar och skapat personliga insikter',
      action: 'Se analyser',
      href: '/my-analyses',
      priority: 'medium',
      icon: Brain
    });
    
    if (stats.activeTasks > 0) {
      steps.push({
        id: 'work-on-program',
        title: 'Arbeta med ditt program',
        description: `Du har ${stats.activeTasks} aktiva uppgifter att fokusera på`,
        action: 'Öppna program',
        href: '/my-program',
        priority: 'medium',
        icon: BookOpen
      });
    }
    
    return steps;
  };

  const nextSteps = getNextSteps();
  const progressPercentage = stats ? Math.round((stats.completedPillars / 6) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Main Progress */}
      <Card className="p-4 md:p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Din utvecklingsresa</h3>
            {!isNewUser && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {stats.completedPillars}/6 områden
              </Badge>
            )}
          </div>
          
          {!isNewUser && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Övergripande framsteg</span>
                <span className="font-medium">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}
          
          {isNewUser && (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-medium mb-1">Välkommen till din utvecklingsresa!</h4>
              <p className="text-sm text-muted-foreground">
                Låt oss börja med att förstå dina mål och utmaningar
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Next Steps */}
      <Card className="p-4 md:p-6">
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Nästa steg
          </h4>
          
          <div className="space-y-3">
            {nextSteps.slice(0, showAdvanced ? nextSteps.length : 2).map((step) => (
              <div key={step.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className={`p-2 rounded-lg ${
                  step.priority === 'high' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <step.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-sm">{step.title}</h5>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <a href={step.href}>
                    {step.action}
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
          
          {nextSteps.length > 2 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center gap-2"
            >
              {showAdvanced ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Visa mindre
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Visa fler alternativ
                </>
              )}
            </Button>
          )}
        </div>
      </Card>

      {/* Quick Stats - Only for experienced users */}
      {!isNewUser && (
        <Card className="p-4 md:p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-lg font-semibold text-blue-600">
                {stats.completedPillars}
              </div>
              <p className="text-xs text-muted-foreground">Slutförda assessments</p>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-green-600">
                {stats.activeTasks || 0}
              </div>
              <p className="text-xs text-muted-foreground">Aktiva uppgifter</p>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-purple-600">
                {Math.round(stats.velocityScore || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Velocity score</p>
            </div>
          </div>
        </Card>
      )}

      {/* Advanced Options Toggle */}
      {!isNewUser && (
        <div className="text-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs flex items-center gap-1"
          >
            <Eye className="h-3 w-3" />
            {showAdvanced ? 'Förenklad vy' : 'Avancerad vy'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ClientSimplifiedWidget;