import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Brain, CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface PipelineStatusProps {
  userId: string;
}

export function AIActionablesPipelineStatus({ userId }: PipelineStatusProps) {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [actionables, setActionables] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testingPipeline, setTestingPipeline] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Ladda assessments med AI-analyser
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessment_rounds')
        .select('*')
        .eq('user_id', userId)
        .not('ai_analysis', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (assessmentError) throw assessmentError;

      // Ladda actionables
      const { data: actionableData, error: actionableError } = await supabase
        .from('calendar_actionables')
        .select('*')
        .eq('user_id', userId)
        .eq('ai_generated', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (actionableError) throw actionableError;

      setAssessments(assessmentData || []);
      setActionables(actionableData || []);
    } catch (error) {
      console.error('Error loading pipeline data:', error);
      toast.error('Kunde inte ladda pipeline-data');
    } finally {
      setLoading(false);
    }
  };

  const testPipeline = async () => {
    if (assessments.length === 0) {
      toast.error('Inga assessments att testa med');
      return;
    }

    setTestingPipeline(true);
    try {
      const latestAssessment = assessments[0];
      
      // Testa auto-actionables-trigger funktionen
      const { error } = await supabase.functions.invoke('auto-actionables-trigger', {
        body: {
          user_id: userId,
          assessment_id: latestAssessment.id,
          pillar_type: latestAssessment.pillar_type,
          ai_analysis: latestAssessment.ai_analysis
        }
      });

      if (error) {
        throw error;
      }

      toast.success('Pipeline-test genomfört! Kontrollera nya actionables');
      setTimeout(loadData, 2000); // Reload data after 2 seconds
    } catch (error) {
      console.error('Error testing pipeline:', error);
      toast.error('Pipeline-test misslyckades: ' + (error as Error).message);
    } finally {
      setTestingPipeline(false);
    }
  };

  const getPipelineStatus = () => {
    if (assessments.length === 0) return 'no-data';
    if (actionables.length === 0) return 'broken';
    
    // Kontrollera om senaste assessment har genererat actionables
    const latestAssessment = assessments[0];
    const recentActionables = actionables.filter(a => 
      new Date(a.created_at) > new Date(latestAssessment.created_at)
    );
    
    return recentActionables.length > 0 ? 'working' : 'delayed';
  };

  const status = getPipelineStatus();

  const getStatusConfig = () => {
    switch (status) {
      case 'working':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          text: 'Fungerar',
          description: 'Pipeline skapar automatiskt actionables från AI-analyser'
        };
      case 'delayed':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          text: 'Fördröjd',
          description: 'Senaste analyser har inte genererat actionables än'
        };
      case 'broken':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          text: 'Bruten',
          description: 'Inga actionables har genererats automatiskt'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          text: 'Ingen data',
          description: 'Inga AI-analyser att testa med'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI-till-Actionables Pipeline Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`flex items-center gap-3 p-3 rounded-lg ${statusConfig.bgColor}`}>
          <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
          <div className="flex-1">
            <div className="font-medium">Status: {statusConfig.text}</div>
            <div className="text-sm text-muted-foreground">{statusConfig.description}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">AI-Analyser</div>
            <div className="text-2xl font-bold text-primary">{assessments.length}</div>
            <div className="text-xs text-muted-foreground">Senaste 5 med AI-analys</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Auto-Actionables</div>
            <div className="text-2xl font-bold text-primary">{actionables.length}</div>
            <div className="text-xs text-muted-foreground">AI-genererade uppgifter</div>
          </div>
        </div>

        {assessments.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Senaste AI-Analys</div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">{assessments[0].pillar_type}</Badge>
                <div className="text-xs text-muted-foreground">
                  {new Date(assessments[0].created_at).toLocaleDateString('sv-SE')}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {assessments[0].ai_analysis?.substring(0, 150)}...
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={testPipeline}
            disabled={testingPipeline || assessments.length === 0}
            size="sm"
            className="flex-1"
          >
            {testingPipeline ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Testar Pipeline...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Testa Pipeline
              </>
            )}
          </Button>
          <Button 
            onClick={loadData}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            Uppdatera
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <div>• Pipeline triggas automatiskt när AI-analyser skapas</div>
          <div>• Skapar kalenderhändelser, uppgifter och actionables</div>
          <div>• Använder enhanced-ai-planning för smart schemaläggning</div>
        </div>
      </CardContent>
    </Card>
  );
}