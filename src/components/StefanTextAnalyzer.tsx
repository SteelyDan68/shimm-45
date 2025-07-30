import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, FileText, Lightbulb, MessageSquare, Target, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { TrainingDataEntry } from '@/hooks/useStefanTrainingData';

interface StefanAnalysis {
  stefan_tonality: {
    word_choice: string;
    tone: string;
    structure: string;
  };
  implied_philosophy: {
    core_values: string[];
    approach_to_clients: string;
    view_on_creativity: string;
    leadership_style: string;
  };
  communication_purpose: {
    primary_intent: string;
    underlying_goals: string[];
    target_outcome: string;
  };
  patterns: {
    feedback_style: string;
    questioning_technique: string;
    challenge_vs_support: string;
    use_of_examples: string;
    conversation_flow: string;
  };
  distinctive_elements: {
    signature_phrases: string[];
    recurring_themes: string[];
    unique_perspective: string;
  };
}

interface StefanTextAnalyzerProps {
  data: TrainingDataEntry[];
  onAnalysisComplete: () => void;
}

const StefanTextAnalyzer: React.FC<StefanTextAnalyzerProps> = ({ data, onAnalysisComplete }) => {
  const [selectedEntry, setSelectedEntry] = useState<TrainingDataEntry | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<StefanAnalysis | null>(null);
  const [customText, setCustomText] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const analyzeText = async (entry?: TrainingDataEntry, text?: string) => {
    if (!user) return;

    setAnalyzing(true);
    try {
      const textContent = text || entry?.content || '';
      const trainingDataId = entry?.id || null;
      const metadata = entry ? {
        subject: entry.subject,
        tone: entry.tone,
        client_name: entry.client_name,
        date_created: entry.date_created,
      } : {};

      const { data: result, error } = await supabase.functions.invoke('stefan-text-analysis', {
        body: {
          textContent,
          trainingDataId,
          metadata
        }
      });

      if (error) throw error;

      if (result.success) {
        setAnalysis(result.analysis);
        toast({
          title: "Analys klar",
          description: "Stefans kommunikationsmönster har analyserats",
        });
        
        if (entry) {
          onAnalysisComplete();
        }
      } else {
        throw new Error(result.error);
      }

    } catch (error: any) {
      console.error('Error analyzing text:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte analysera texten",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const renderAnalysisSection = (title: string, icon: React.ReactNode, content: any) => {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {typeof content === 'object' && content !== null ? (
            Object.entries(content).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                  {key.replace(/_/g, ' ')}
                </h4>
                {Array.isArray(value) ? (
                  <div className="flex flex-wrap gap-1">
                    {value.map((item: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{String(value)}</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm leading-relaxed">{String(content)}</p>
          )}
        </CardContent>
      </Card>
    );
  };

  const getExistingAnalysis = (entry: TrainingDataEntry): StefanAnalysis | null => {
    return entry.metadata?.stefan_analysis?.analysis || null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Stefan Kommunikationsanalys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="saved-data" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="saved-data">Analysera sparad data</TabsTrigger>
              <TabsTrigger value="custom-text">Analysera anpassad text</TabsTrigger>
            </TabsList>
            
            <TabsContent value="saved-data" className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold">Välj träningsdata att analysera:</h3>
                <ScrollArea className="h-64 border rounded-lg p-4">
                  {data.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Ingen träningsdata tillgänglig för analys
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {data.map((entry) => {
                        const existingAnalysis = getExistingAnalysis(entry);
                        return (
                          <Card 
                            key={entry.id} 
                            className={`p-3 cursor-pointer transition-colors ${
                              selectedEntry?.id === entry.id ? 'ring-2 ring-primary' : ''
                            }`}
                            onClick={() => setSelectedEntry(entry)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="h-4 w-4" />
                                  {entry.subject && (
                                    <Badge variant="outline">{entry.subject}</Badge>
                                  )}
                                  {entry.tone && (
                                    <Badge variant="secondary">{entry.tone}</Badge>
                                  )}
                                  {existingAnalysis && (
                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                      Analyserad
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {entry.content.length > 100 
                                    ? `${entry.content.substring(0, 100)}...`
                                    : entry.content
                                  }
                                </p>
                                {entry.date_created && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {entry.date_created}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
                
                {selectedEntry && (
                  <Button 
                    onClick={() => analyzeText(selectedEntry)} 
                    disabled={analyzing}
                    className="w-full"
                  >
                    {analyzing ? 'Analyserar...' : 'Analysera vald text'}
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="custom-text" className="space-y-4">
              <div className="space-y-4">
                <Textarea
                  placeholder="Klistra in text att analysera här..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={8}
                />
                <Button 
                  onClick={() => analyzeText(undefined, customText)} 
                  disabled={analyzing || !customText.trim()}
                  className="w-full"
                >
                  {analyzing ? 'Analyserar...' : 'Analysera text'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {analysis && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Analysresultat
          </h2>
          
          {renderAnalysisSection(
            "Stefan-tonalitet",
            <MessageSquare className="h-5 w-5" />,
            analysis.stefan_tonality
          )}
          
          {renderAnalysisSection(
            "Implicerad filosofi",
            <Lightbulb className="h-5 w-5" />,
            analysis.implied_philosophy
          )}
          
          {renderAnalysisSection(
            "Kommunikationssyfte",
            <Target className="h-5 w-5" />,
            analysis.communication_purpose
          )}
          
          {renderAnalysisSection(
            "Kommunikationsmönster",
            <Brain className="h-5 w-5" />,
            analysis.patterns
          )}
          
          {renderAnalysisSection(
            "Distinkta element",
            <Sparkles className="h-5 w-5" />,
            analysis.distinctive_elements
          )}
        </div>
      )}
    </div>
  );
};

export default StefanTextAnalyzer;