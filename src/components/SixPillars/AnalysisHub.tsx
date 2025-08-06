import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  TrendingUp, 
  Calendar, 
  FileText,
  ArrowRight,
  Lightbulb,
  Target
} from 'lucide-react';

/**
 * 🧠 ANALYSIS HUB WIDGET
 * 
 * Kompakt översikt för ModularPillarDashboard som visar:
 * - Senaste pillar-analyser
 * - Snabblänkar till fullständig analysvy
 * - Kortfattad sammanfattning av framsteg
 */

interface PillarAnalysis {
  id: string;
  pillar_type: string;
  ai_analysis: string;
  calculated_score?: number;
  created_at: string;
  scores: any;
}

interface AnalysisHubProps {
  userId: string;
  onViewFullAnalysis?: () => void;
  compact?: boolean;
}

export const AnalysisHub = ({ 
  userId, 
  onViewFullAnalysis,
  compact = false 
}: AnalysisHubProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [recentAnalyses, setRecentAnalyses] = useState<PillarAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalAnalyses, setTotalAnalyses] = useState(0);

  // 📊 LOAD RECENT ANALYSES
  const loadRecentAnalyses = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      
      const { data: analyses, error } = await supabase
        .from('path_entries')
        .select('id, content, metadata, created_at')
        .eq('user_id', userId)
        .eq('type', 'assessment')
        .not('content', 'is', null)
        .order('created_at', { ascending: false })
        .limit(compact ? 3 : 5);

      if (error) throw error;

      // Process analyses från path_entries
      const processedAnalyses: PillarAnalysis[] = (analyses || []).map(entry => {
        const metadata = entry.metadata as any;
        const assessmentScore = metadata?.assessment_score || 0;
        
        return {
          id: entry.id,
          pillar_type: metadata?.pillar_key || 'unknown',
          created_at: entry.created_at,
          calculated_score: assessmentScore,
          ai_analysis: entry.content || '',
          scores: metadata?.assessment_data || {}
        };
      });

      setRecentAnalyses(processedAnalyses);

      // Get total count
      const { count } = await supabase
        .from('path_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'assessment')
        .not('content', 'is', null);

      setTotalAnalyses(count || 0);

    } catch (error: any) {
      console.error('Error loading recent analyses:', error);
      if (!compact) {
        toast({
          title: "Fel",
          description: "Kunde inte ladda analyser",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 🎨 PILLAR HELPERS
  const getPillarColor = (pillarType: string) => {
    const colors: Record<string, string> = {
      'talent': 'bg-purple-100 text-purple-700',
      'mindset': 'bg-blue-100 text-blue-700', 
      'relationships': 'bg-green-100 text-green-700',
      'emotions': 'bg-red-100 text-red-700',
      'physical': 'bg-orange-100 text-orange-700',
      'environment': 'bg-teal-100 text-teal-700'
    };
    return colors[pillarType] || 'bg-gray-100 text-gray-700';
  };

  const getPillarName = (pillarType: string) => {
    const names: Record<string, string> = {
      'talent': '🎯 Talang',
      'mindset': '🧠 Mindset',
      'relationships': '👥 Relationer', 
      'emotions': '❤️ Känslor',
      'physical': '💪 Fysisk',
      'environment': '🌍 Miljö'
    };
    return names[pillarType] || pillarType;
  };

  useEffect(() => {
    loadRecentAnalyses();
  }, [userId]);

  if (isLoading) {
    return (
      <Card className={compact ? "h-48" : undefined}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Senaste Analyser
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentAnalyses.length === 0 ? (
            <div className="text-center py-4">
              <Lightbulb className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">Inga analyser än</p>
            </div>
          ) : (
            <>
              {recentAnalyses.slice(0, 2).map((analysis) => (
                <div key={analysis.id} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getPillarColor(analysis.pillar_type)}`}>
                      {getPillarName(analysis.pillar_type).split(' ')[1]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(analysis.created_at).toLocaleDateString('sv-SE')}
                    </span>
                  </div>
                  <span className="text-sm font-semibold">
                    {analysis.calculated_score?.toFixed(1) || '—'}/10
                  </span>
                </div>
              ))}
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full" 
                onClick={onViewFullAnalysis}
              >
                Se alla {totalAnalyses} analyser
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full version
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI-Analyser översikt
          <Badge variant="outline">{totalAnalyses} totalt</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentAnalyses.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold mb-2">Inga analyser ännu</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Genomför pillar-bedömningar för att få djupa AI-analyser
            </p>
            <Button onClick={() => window.location.href = '/six-pillars'}>
              Starta bedömning
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              {recentAnalyses.map((analysis) => (
                <div 
                  key={analysis.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={getPillarColor(analysis.pillar_type)}>
                      {getPillarName(analysis.pillar_type)}
                    </Badge>
                    <div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {analysis.ai_analysis.substring(0, 80)}...
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(analysis.created_at).toLocaleDateString('sv-SE')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      {analysis.calculated_score?.toFixed(1) || '—'}
                    </div>
                    <div className="text-xs text-muted-foreground">av 10</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Visar {recentAnalyses.length} av {totalAnalyses} analyser
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onViewFullAnalysis}
              >
                <FileText className="h-4 w-4 mr-2" />
                Visa alla analyser
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};