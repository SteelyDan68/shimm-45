import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Brain, Calendar, Target, TrendingUp, FileText, Lightbulb } from 'lucide-react';
import { PILLAR_MODULES } from '@/config/pillarModules';

interface DetailedAnalysisViewProps {
  pillarKey: string;
  userId: string;
  onBack: () => void;
}

interface PillarAnalysisData {
  id: string;
  pillar_type: string;
  ai_analysis: string;
  calculated_score: number;
  created_at: string;
  answers: Record<string, any>;
  actionables?: Array<{
    id: string;
    title: string;
    description: string;
    priority: string;
    completion_status: string;
  }>;
}

export function DetailedAnalysisView({ pillarKey, userId, onBack }: DetailedAnalysisViewProps) {
  const [analysisData, setAnalysisData] = useState<PillarAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const pillarConfig = PILLAR_MODULES[pillarKey];

  useEffect(() => {
    loadDetailedAnalysis();
  }, [pillarKey, userId]);

  const loadDetailedAnalysis = async () => {
    try {
      setLoading(true);

      // Get the latest assessment round for this pillar
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessment_rounds')
        .select('*')
        .eq('user_id', userId)
        .eq('pillar_type', pillarKey)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (assessmentError && assessmentError.code !== 'PGRST116') {
        throw assessmentError;
      }

      if (!assessmentData) {
        toast({
          title: "Ingen analys hittades",
          description: "Ingen AI-analys hittades för denna pelare.",
          variant: "destructive"
        });
        return;
      }

      // Get related actionables
      const { data: actionablesData } = await supabase
        .from('calendar_actionables')
        .select('id, title, description, priority, completion_status')
        .eq('user_id', userId)
        .eq('pillar_key', pillarKey)
        .order('created_at', { ascending: false });

      setAnalysisData({
        id: assessmentData.id,
        pillar_type: assessmentData.pillar_type,
        ai_analysis: assessmentData.ai_analysis || '',
        calculated_score: assessmentData.scores?.[pillarKey] || 0,
        created_at: assessmentData.created_at,
        answers: assessmentData.answers as Record<string, any> || {},
        actionables: actionablesData || []
      });

    } catch (error) {
      console.error('Error loading detailed analysis:', error);
      toast({
        title: "Fel vid laddning",
        description: "Kunde inte ladda detaljerad analys.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAnalysisText = (text: string) => {
    if (!text) return [];
    
    // Split by common section headers and clean up
    const sections = text.split(/(?=\*\*[^*]+\*\*|\d+\.|#{1,3}|•)/)
      .filter(section => section.trim().length > 0)
      .map(section => section.trim());

    return sections;
  };

  const getSectionType = (text: string): 'header' | 'bullet' | 'paragraph' => {
    if (text.startsWith('**') || text.startsWith('#') || text.match(/^\d+\./)) {
      return 'header';
    }
    if (text.startsWith('•') || text.startsWith('-')) {
      return 'bullet';
    }
    return 'paragraph';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Laddar detaljerad analys...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Ingen analys tillgänglig</h3>
            <p className="text-muted-foreground mb-4">
              Det finns ingen AI-analys för {pillarConfig?.name || pillarKey} ännu.
            </p>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const analysisTextSections = formatAnalysisText(analysisData.ai_analysis);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {pillarConfig?.icon && <span className="text-2xl">{pillarConfig.icon}</span>}
            Detaljerad analys: {pillarConfig?.name || pillarKey}
          </h1>
          <p className="text-muted-foreground">
            Fullständig AI-analys och rekommendationer
          </p>
        </div>
        <div className={`px-4 py-2 rounded-lg ${getScoreColor(analysisData.calculated_score)}`}>
          <div className="text-lg font-bold">{analysisData.calculated_score}/100</div>
          <div className="text-xs">Poäng</div>
        </div>
      </div>

      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI-Analys
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Insikter
          </TabsTrigger>
          <TabsTrigger value="actionables" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Åtgärder ({analysisData.actionables?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                Fullständig AI-Analys
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Skapad: {new Date(analysisData.created_at).toLocaleDateString('sv-SE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {analysisTextSections.map((section, index) => {
                    const sectionType = getSectionType(section);
                    
                    if (sectionType === 'header') {
                      return (
                        <div key={index} className="py-2">
                          <h3 className="text-lg font-semibold text-gray-900 border-b pb-1">
                            {section.replace(/\*\*/g, '').replace(/#{1,3}/g, '').replace(/^\d+\./, '').trim()}
                          </h3>
                        </div>
                      );
                    } else if (sectionType === 'bullet') {
                      return (
                        <div key={index} className="pl-4">
                          <p className="text-gray-700 leading-relaxed">
                            {section.replace(/^[•-]\s*/, '• ')}
                          </p>
                        </div>
                      );
                    } else {
                      return (
                        <div key={index}>
                          <p className="text-gray-700 leading-relaxed">
                            {section}
                          </p>
                        </div>
                      );
                    }
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                Viktigaste insikter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-900 mb-2">Poäng & Nivå</h4>
                  <p className="text-sm text-blue-800">
                    Du fick {analysisData.calculated_score}/100 poäng på {pillarConfig?.name || pillarKey}.
                    {analysisData.calculated_score >= 80 && " Utmärkt resultat!"}
                    {analysisData.calculated_score >= 60 && analysisData.calculated_score < 80 && " Bra grund att bygga vidare på."}
                    {analysisData.calculated_score < 60 && " Stor potential för förbättring."}
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-semibold text-green-900 mb-2">Aktiviteter skapade</h4>
                  <p className="text-sm text-green-800">
                    {analysisData.actionables?.length || 0} personliga aktiviteter har skapats baserat på din analys.
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <h4 className="font-semibold text-purple-900 mb-2">AI-Driven insikter</h4>
                  <p className="text-sm text-purple-800">
                    Analysen baseras på dina svar och AI:ns djupa förståelse av personal utveckling.
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                  <h4 className="font-semibold text-orange-900 mb-2">Nästa steg</h4>
                  <p className="text-sm text-orange-800">
                    Börja med att genomföra de skapade aktiviteterna för att fördjupa din utveckling.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actionables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Personliga åtgärder
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Aktiviteter som skapats baserat på din analys
              </p>
            </CardHeader>
            <CardContent>
              {!analysisData.actionables || analysisData.actionables.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    Inga aktiviteter har skapats för denna analys än.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analysisData.actionables.map((actionable) => (
                    <div key={actionable.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{actionable.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {actionable.description}
                          </p>
                          <div className="flex gap-2">
                            <Badge 
                              variant={actionable.priority === 'high' ? 'destructive' : 
                                      actionable.priority === 'medium' ? 'default' : 'secondary'}
                            >
                              {actionable.priority === 'high' ? 'Hög prioritet' :
                               actionable.priority === 'medium' ? 'Mellan prioritet' : 'Låg prioritet'}
                            </Badge>
                            <Badge 
                              variant={actionable.completion_status === 'completed' ? 'default' : 'outline'}
                            >
                              {actionable.completion_status === 'completed' ? 'Klar' :
                               actionable.completion_status === 'in_progress' ? 'Pågår' : 'Väntar'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}