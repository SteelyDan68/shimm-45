import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/components/ui/use-toast';

export interface StefanAnalyzedData {
  id: string;
  filename?: string;
  tone: string;
  style: string;
  themes: string[];
  used_phrases: string[];
  recommended_use: string;
  content: string;
  analyzed_at: string;
}

export const useStefanKnowledgeBase = () => {
  const [loading, setLoading] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<StefanAnalyzedData[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Hämta all analyserad Stefan-data för att bygga kunskapsbas
  const fetchAnalyzedData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: trainingData, error } = await supabase
        .from('training_data_stefan')
        .select('*')
        .not('metadata->stefan_analysis', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedData: StefanAnalyzedData[] = (trainingData || []).map(entry => {
        const metadata = entry.metadata as any;
        const analysis = metadata?.stefan_analysis?.analysis;
        
        return {
          id: entry.id,
          filename: entry.original_filename,
          tone: analysis?.stefan_tonality?.tone || 'okänd',
          style: analysis?.stefan_tonality?.structure || 'okänd',
          themes: analysis?.distinctive_elements?.recurring_themes || [],
          used_phrases: analysis?.distinctive_elements?.signature_phrases || [],
          recommended_use: metadata?.recommended_use || 'allmän referens',
          content: entry.content,
          analyzed_at: metadata?.stefan_analysis?.analyzed_at || entry.created_at,
        };
      });

      setAnalyzedData(processedData);
    } catch (error: any) {
      console.error('Error fetching analyzed data:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta analyserad data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Lägg till manuell analyserad data (som JSON från användaren)
  const addManualAnalysis = async (analysisData: {
    filename: string;
    tone: string;
    style: string;
    themes: string[];
    used_phrases: string[];
    recommended_use: string;
    content?: string;
  }) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('training_data_stefan')
        .insert({
          user_id: user.id,
          content: analysisData.content || `Manuell analys: ${analysisData.filename}`,
          content_type: 'manual',
          subject: 'Manuell stilanalys',
          original_filename: analysisData.filename,
          metadata: {
            stefan_analysis: {
              analyzed_at: new Date().toISOString(),
              analysis: {
                stefan_tonality: {
                  tone: analysisData.tone,
                  structure: analysisData.style,
                },
                distinctive_elements: {
                  recurring_themes: analysisData.themes,
                  signature_phrases: analysisData.used_phrases,
                },
              },
              ai_model: 'manual_analysis'
            },
            recommended_use: analysisData.recommended_use
          }
        });

      if (error) throw error;

      toast({
        title: "Analys sparad",
        description: `${analysisData.filename} har lagts till i kunskapsbasen`,
      });

      await fetchAnalyzedData();
      return true;

    } catch (error: any) {
      console.error('Error saving manual analysis:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara analysen",
        variant: "destructive",
      });
      return false;
    }
  };

  // Få sammandrag av alla analyserade mönster för AI-prompten
  const getKnowledgeBaseSummary = () => {
    if (analyzedData.length === 0) return null;

    const allThemes = [...new Set(analyzedData.flatMap(d => d.themes))];
    const allPhrases = [...new Set(analyzedData.flatMap(d => d.used_phrases))];
    const tonePatterns = [...new Set(analyzedData.map(d => d.tone))];

    return {
      totalAnalyzedTexts: analyzedData.length,
      commonThemes: allThemes,
      signaturePhrases: allPhrases,
      tonePatterns: tonePatterns,
      latestAnalysis: analyzedData[0],
    };
  };

  return {
    analyzedData,
    loading,
    fetchAnalyzedData,
    addManualAnalysis,
    getKnowledgeBaseSummary,
  };
};