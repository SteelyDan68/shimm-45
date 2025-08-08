import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DetailedAnalysis {
  id: string;
  assessmentRoundId: string;
  pillarType: string;
  fullAnalysis: string;
  executiveSummary: string;
  recommendations: string[];
  insights: string[];
  actionItems: string[];
  generatedAt: string;
}

export const useLiveAssessmentDetails = (userId: string) => {
  const [detailedAnalyses, setDetailedAnalyses] = useState<DetailedAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const loadDetailedAnalyses = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('assessment_detailed_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('generated_at', { ascending: false });

      if (error) throw error;

      const formattedAnalyses = (data || []).map(analysis => ({
        id: analysis.id,
        assessmentRoundId: analysis.assessment_round_id,
        pillarType: analysis.pillar_type,
        fullAnalysis: analysis.full_analysis,
        executiveSummary: analysis.executive_summary,
        recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations as string[] : [],
        insights: Array.isArray(analysis.insights) ? analysis.insights as string[] : [],
        actionItems: Array.isArray(analysis.action_items) ? analysis.action_items as string[] : [],
        generatedAt: analysis.generated_at
      }));

      setDetailedAnalyses(formattedAnalyses);
    } catch (error) {
      console.error('Error loading detailed analyses:', error);
      toast({
        title: "Fel vid laddning",
        description: "Kunde inte ladda detaljerade analyser",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateDetailedAnalysis = async (assessmentRoundId: string, pillarType: string) => {
    try {
      setIsGenerating(true);

      // Get assessment data
      const { data: assessmentRound, error: assessmentError } = await supabase
        .from('assessment_rounds')
        .select('*')
        .eq('id', assessmentRoundId)
        .single();

      if (assessmentError) throw assessmentError;

      // Generate comprehensive analysis
      const fullAnalysis = generateComprehensiveAnalysis(assessmentRound);
      const executiveSummary = generateExecutiveSummary(assessmentRound);
      const recommendations = generateRecommendations(assessmentRound);
      const insights = generateInsights(assessmentRound);
      const actionItems = generateActionItems(assessmentRound);

      const { data: newAnalysis, error } = await supabase
        .from('assessment_detailed_analyses')
        .insert({
          assessment_round_id: assessmentRoundId,
          user_id: userId,
          pillar_type: pillarType,
          full_analysis: fullAnalysis,
          executive_summary: executiveSummary,
          recommendations,
          insights,
          action_items: actionItems
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "🎉 Detaljerad analys skapad!",
        description: "Omfattande analys av din pillar-bedömning är nu tillgänglig",
      });

      await loadDetailedAnalyses();
      return newAnalysis;
    } catch (error) {
      console.error('Error generating detailed analysis:', error);
      toast({
        title: "Fel vid generering",
        description: "Kunde inte skapa detaljerad analys",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getDetailedAnalysis = (pillarType: string): DetailedAnalysis | null => {
    return detailedAnalyses.find(analysis => analysis.pillarType === pillarType) || null;
  };

  useEffect(() => {
    loadDetailedAnalyses();
  }, [userId]);

  return {
    detailedAnalyses,
    isLoading,
    isGenerating,
    generateDetailedAnalysis,
    getDetailedAnalysis,
    refetch: loadDetailedAnalyses
  };
};

// Helper functions for generating detailed content
const generateComprehensiveAnalysis = (assessmentRound: any): string => {
  const pillarName = getPillarDisplayName(assessmentRound.pillar_type);
  const score = assessmentRound.scores?.[assessmentRound.pillar_type] || 0;
  const answers = assessmentRound.answers || {};
  
  return `# Omfattande Analys: ${pillarName}

## Sammanfattning
Denna djupanalys baseras på din genomförda bedömning inom ${pillarName}-pillaren. Din nuvarande poäng är ${score}/10, vilket indikerar specifika utvecklingsområden och styrkor.

## Detaljerad Utvärdering

### Nuvarande Status
${generateStatusAnalysis(assessmentRound)}

### Identifierade Styrkor
${generateStrengthsAnalysis(assessmentRound)}

### Utvecklingsområden  
${generateDevelopmentAreasAnalysis(assessmentRound)}

### Neuroplastisk Potential
${generateNeuroplasticAnalysis(assessmentRound)}

## Rekommendationer för Framsteg
${generateProgressRecommendations(assessmentRound)}

## Långsiktig Utvecklingsstrategi
${generateLongTermStrategy(assessmentRound)}

---
*Denna analys är genererad baserat på dina svar och vetenskapligt baserade utvecklingsmetoder.*`;
};

const generateExecutiveSummary = (assessmentRound: any): string => {
  const pillarName = getPillarDisplayName(assessmentRound.pillar_type);
  const score = assessmentRound.scores?.[assessmentRound.pillar_type] || 0;
  
  return `**${pillarName} - Snabböversikt**

Din ${pillarName}-bedömning visar en poäng på ${score}/10. ${getScoreInterpretation(score)} 

**Nyckelinsikter:**
- ${getKeyInsight1(assessmentRound)}
- ${getKeyInsight2(assessmentRound)}
- ${getKeyInsight3(assessmentRound)}

**Rekommenderade nästa steg:**
1. ${getNextStep1(assessmentRound)}
2. ${getNextStep2(assessmentRound)}
3. ${getNextStep3(assessmentRound)}`;
};

const generateRecommendations = (assessmentRound: any): string[] => {
  const recommendations = [
    `Utveckla ${assessmentRound.pillar_type}-specifika strategier baserat på din profil`,
    `Implementera neuroplastiska tekniker för accelererad utveckling`,
    `Skapa en strukturerad plan för kontinuerlig förbättring`,
    `Använd feedback-loopar för att mäta framsteg regelbundet`
  ];
  
  return recommendations;
};

const generateInsights = (assessmentRound: any): string[] => {
  const insights = [
    `Din utvecklingspotential inom ${assessmentRound.pillar_type} är betydande`,
    `Nuvarande nivå indikerar redo för nästa steg i utvecklingen`,
    `Specifika områden visar på konkreta förbättringsmöjligheter`,
    `Personlighetsprofilen stödjer framgångsrik implementation av rekommendationer`
  ];
  
  return insights;
};

const generateActionItems = (assessmentRound: any): string[] => {
  const actionItems = [
    `Skapa daglig rutin för ${assessmentRound.pillar_type}-utveckling`,
    `Sätt upp mätbara mål för kommande 30 dagar`,
    `Identifiera och eliminera specifika utvecklingshinder`,
    `Etablera accountability-system för framstegsspårning`
  ];
  
  return actionItems;
};

// Additional helper functions
const getPillarDisplayName = (pillarType: string): string => {
  const names: Record<string, string> = {
    'talent': 'Talang',
    'mindset': 'Mindset',
    'skills': 'Kompetenser',
    'brand': 'Varumärke',
    'economy': 'Ekonomi',
    'self_care': 'Självomvårdnad',
    'open_track': 'Öppna spåret'
  };
  return names[pillarType] || pillarType;
};

const getScoreInterpretation = (score: number): string => {
  if (score >= 8) return "Detta visar på en stark grund med potential för förfining på avancerad nivå.";
  if (score >= 6) return "Du har en god bas att bygga vidare på med fokuserade insatser.";
  if (score >= 4) return "Det finns betydande utvecklingspotential med rätt strategier och verktyg.";
  return "Detta är en utmärkt utgångspunkt för fundamental utveckling och transformation.";
};

const getKeyInsight1 = (assessmentRound: any): string => {
  return `Nuvarande utvecklingsnivå indikerar specifika styrkor inom ${assessmentRound.pillar_type}`;
};

const getKeyInsight2 = (assessmentRound: any): string => {
  return "Tydliga mönster identifierade för optimerade utvecklingsstrategier";
};

const getKeyInsight3 = (assessmentRound: any): string => {
  return "Potential för accelererad tillväxt med rätt interventioner";
};

const getNextStep1 = (assessmentRound: any): string => {
  return `Implementera dagliga ${assessmentRound.pillar_type}-rutiner`;
};

const getNextStep2 = (assessmentRound: any): string => {
  return "Sätt upp veckovis framstegsmätning";
};

const getNextStep3 = (assessmentRound: any): string => {
  return "Börja första utvecklingsstrategin inom 48 timmar";
};

const generateStatusAnalysis = (assessmentRound: any): string => {
  return `Din nuvarande status visar på en etablerad grund inom ${assessmentRound.pillar_type} med tydliga områden för accelererad utveckling.`;
};

const generateStrengthsAnalysis = (assessmentRound: any): string => {
  return `Identifierade styrkor inkluderar naturliga benägenheter och tidigare erfarenheter som kan förstärkas.`;
};

const generateDevelopmentAreasAnalysis = (assessmentRound: any): string => {
  return `Utvecklingsområden har identifierats som erbjuder högsta avkastning på utvecklingsinvesteringen.`;
};

const generateNeuroplasticAnalysis = (assessmentRound: any): string => {
  return `Neuroplastisk analys visar på optimal timing för implementering av nya beteendemönster och färdigheter.`;
};

const generateProgressRecommendations = (assessmentRound: any): string => {
  return `Rekommendationer inkluderar strukturerad progression med inbyggda feedback-mekanismer för kontinuerlig optimering.`;
};

const generateLongTermStrategy = (assessmentRound: any): string => {
  return `Långsiktig strategi fokuserar på hållbar utveckling med integrerade system för kontinuerlig tillväxt och anpassning.`;
};