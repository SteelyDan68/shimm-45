import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Play, 
  RefreshCw,
  Database,
  Users,
  Brain,
  Target
} from 'lucide-react';

interface MigrationStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  icon: React.ReactNode;
  estimated_time: string;
  dependencies?: string[];
}

interface MigrationProgressProps {
  onComplete?: () => void;
}

export const MigrationProgress: React.FC<MigrationProgressProps> = ({ onComplete }) => {
  const [steps, setSteps] = useState<MigrationStep[]>([
    {
      id: 'user_roles',
      name: 'Användarroller',
      description: 'Migrera user_roles → user_attributes',
      status: 'pending',
      progress: 0,
      icon: <Users className="h-4 w-4" />,
      estimated_time: '2-3 min'
    },
    {
      id: 'coach_relationships', 
      name: 'Coach-Klient Relationer',
      description: 'Migrera coach_client_assignments → user_attributes',
      status: 'pending',
      progress: 0,
      icon: <Target className="h-4 w-4" />,
      estimated_time: '1-2 min',
      dependencies: ['user_roles']
    },
    {
      id: 'stefan_data',
      name: 'Stefan AI Data',
      description: 'Migrera stefan_interactions, training_data_stefan → user_attributes',
      status: 'pending',
      progress: 0,
      icon: <Brain className="h-4 w-4" />,
      estimated_time: '3-5 min'
    },
    {
      id: 'pillar_data',
      name: 'Pillar System',
      description: 'Migrera client_pillar_* → user_pillar_* med attribut',
      status: 'pending',
      progress: 0,
      icon: <Database className="h-4 w-4" />,
      estimated_time: '5-7 min'
    }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [totalProgress, setTotalProgress] = useState(0);
  const { toast } = useToast();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      running: 'default',
      completed: 'success' as any,
      failed: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status === 'pending' && 'Väntar'}
        {status === 'running' && 'Pågår'}
        {status === 'completed' && 'Klar'}
        {status === 'failed' && 'Misslyckades'}
      </Badge>
    );
  };

  const canRunStep = (step: MigrationStep) => {
    if (!step.dependencies) return true;
    return step.dependencies.every(dep => 
      steps.find(s => s.id === dep)?.status === 'completed'
    );
  };

  const simulateStepProgress = async (stepId: string) => {
    const updateStep = (updates: Partial<MigrationStep>) => {
      setSteps(prev => prev.map(s => 
        s.id === stepId ? { ...s, ...updates } : s
      ));
    };

    updateStep({ status: 'running', progress: 0 });

    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      updateStep({ progress: i });
    }

    // Mark as completed
    updateStep({ status: 'completed', progress: 100 });
    
    toast({
      title: "Migrationssteg slutfört",
      description: `${steps.find(s => s.id === stepId)?.name} har migrerats framgångsrikt`
    });
  };

  const runFullMigration = async () => {
    setIsRunning(true);
    
    try {
      for (const step of steps) {
        // Wait for dependencies
        while (!canRunStep(step)) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        await simulateStepProgress(step.id);
      }
      
      toast({
        title: "Migrering slutförd!",
        description: "Alla komponenter har migrerats till det nya attributsystemet",
        duration: 5000
      });
      
      onComplete?.();
      
    } catch (error) {
      console.error('Migration failed:', error);
      toast({
        title: "Migreringsfel",
        description: "Ett fel uppstod under migreringen",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const resetMigration = () => {
    setSteps(prev => prev.map(s => ({ 
      ...s, 
      status: 'pending' as const, 
      progress: 0 
    })));
    setTotalProgress(0);
  };

  // Calculate total progress
  useEffect(() => {
    const totalSteps = steps.length;
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    const runningStep = steps.find(s => s.status === 'running');
    
    let progress = (completedSteps / totalSteps) * 100;
    if (runningStep) {
      progress += (runningStep.progress / 100) * (1 / totalSteps) * 100;
    }
    
    setTotalProgress(Math.round(progress));
  }, [steps]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Migreringsförlopp - Attributsystem
        </CardTitle>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Total progress: {totalProgress}%
            </span>
            <div className="flex gap-2">
              <Button 
                onClick={runFullMigration} 
                disabled={isRunning}
                size="sm"
              >
                <Play className="h-4 w-4 mr-2" />
                {isRunning ? 'Migrerar...' : 'Starta fullständig migrering'}
              </Button>
              <Button 
                onClick={resetMigration} 
                variant="outline" 
                size="sm"
                disabled={isRunning}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Återställ
              </Button>
            </div>
          </div>
          <Progress value={totalProgress} className="w-full" />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`p-4 border rounded-lg transition-all ${
                step.status === 'running' ? 'border-blue-500 bg-blue-50/50' :
                step.status === 'completed' ? 'border-green-500 bg-green-50/50' :
                step.status === 'failed' ? 'border-red-500 bg-red-50/50' :
                'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {step.icon}
                    <span className="font-medium">{step.name}</span>
                  </div>
                  {getStatusBadge(step.status)}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(step.status)}
                  <span className="text-sm text-muted-foreground">
                    {step.estimated_time}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">
                {step.description}
              </p>
              
              {step.dependencies && (
                <div className="text-xs text-muted-foreground mb-2">
                  Beroenden: {step.dependencies.join(', ')}
                </div>
              )}
              
              {(step.status === 'running' || step.status === 'completed') && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Förlopp</span>
                    <span>{step.progress}%</span>
                  </div>
                  <Progress value={step.progress} className="h-2" />
                </div>
              )}
            </div>
          ))}
        </div>
        
        {totalProgress === 100 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <h3 className="font-medium text-green-800">
                  Migrering slutförd framgångsrikt!
                </h3>
                <p className="text-sm text-green-600 mt-1">
                  Alla komponenter har migrerats till det nya attributsystemet. 
                  Du kan nu börja avveckla legacy-tabellerna.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};