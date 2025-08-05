import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'scale' | 'multiple_choice' | 'text' | 'boolean';
  options?: string[];
  required: boolean;
  category: string;
  pillar?: string;
}

export interface AssessmentResponse {
  question_id: string;
  value: any;
  score?: number;
}

export interface AssessmentResult {
  id: string;
  user_id: string;
  assessment_type: string;
  pillar_key?: string;
  responses: AssessmentResponse[];
  total_score: number;
  category_scores: Record<string, number>;
  insights: string[];
  recommendations: string[];
  created_at: string;
}

export interface AssessmentTemplate {
  id: string;
  name: string;
  type: 'pillar' | 'universal' | 'insight' | 'custom';
  pillar_key?: string;
  questions: AssessmentQuestion[];
  scoring_rules: any;
  active: boolean;
}

export const useUnifiedAssessment = () => {
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTemplates = useCallback(async () => {
    try {
      // Fetch real templates from database
      const { data, error } = await supabase
        .from('assessment_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('No assessment templates found, using fallback');
        // Create fallback templates if table is empty or has errors
        const fallbackTemplates: AssessmentTemplate[] = [
          {
            id: 'self-care-fallback',
            name: 'Self Care Assessment',
            type: 'pillar',
            pillar_key: 'self_care',
            questions: [],
            scoring_rules: {},
            active: true
          }
        ];
        setTemplates(fallbackTemplates);
        return;
      }

      // Convert database format to hook format - keep it simple
      const convertedTemplates: AssessmentTemplate[] = (data || []).map(template => ({
        id: template.id,
        name: template.name,
        type: 'pillar' as const,
        pillar_key: template.pillar_key,
        questions: [], // Keep empty for now - questions can be loaded separately if needed
        scoring_rules: template.scoring_config || {},
        active: template.is_active
      }));
      
      setTemplates(convertedTemplates);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      // Fallback to basic template
      setTemplates([{
        id: 'fallback',
        name: 'Basic Assessment',
        type: 'pillar',
        pillar_key: 'self_care',
        questions: [],
        scoring_rules: {},
        active: true
      }]);
    }
  }, [toast]);

  const fetchResults = useCallback(async (userId?: string) => {
    try {
      // Use existing pillar assessments as results
      let query = supabase
        .from('pillar_assessments')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Convert to unified format
      const convertedResults: AssessmentResult[] = (data || []).map(assessment => ({
        id: assessment.id,
        user_id: assessment.user_id,
        assessment_type: 'pillar',
        pillar_key: assessment.pillar_key,
        responses: [],
        total_score: assessment.calculated_score || 0,
        category_scores: {},
        insights: Array.isArray(assessment.insights) ? 
          assessment.insights as string[] : 
          typeof assessment.insights === 'string' ? 
            [assessment.insights] : [],
        recommendations: [],
        created_at: assessment.created_at
      }));
      
      setResults(convertedResults);
    } catch (error: any) {
      console.error('Error fetching results:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta assessment resultat",
        variant: "destructive"
      });
    }
  }, [toast]);

  const submitAssessment = useCallback(async (
    userId: string,
    templateId: string,
    responses: AssessmentResponse[]
  ): Promise<AssessmentResult | null> => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      // Calculate scores based on template rules
      const totalScore = responses.reduce((sum, response) => {
        return sum + (response.score || 0);
      }, 0);

      const categoryScores = responses.reduce((acc, response) => {
        const question = template.questions.find(q => q.id === response.question_id);
        if (question && question.category) {
          acc[question.category] = (acc[question.category] || 0) + (response.score || 0);
        }
        return acc;
      }, {} as Record<string, number>);

      // Generate insights using AI service
      const { data: aiResult } = await supabase.functions.invoke('analyze-pillar-assessment', {
        body: {
          pillarKey: template.pillar_key,
          responses,
          totalScore,
          categoryScores
        }
      });

      const insights = aiResult?.insights || [];

      // Save to pillar_assessments table
      const { data: result, error } = await supabase
        .from('pillar_assessments')
        .insert([{
          user_id: userId,
          pillar_key: template.pillar_key || 'universal',
          calculated_score: totalScore,
          insights,
          created_by: userId
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchResults(); // Refresh results
      
      toast({
        title: "Assessment slutförd! 🎉",
        description: "Dina svar har analyserats och insikter genererade"
      });

      // Convert to unified format for return
      return {
        id: result.id,
        user_id: result.user_id,
        assessment_type: 'pillar',
        pillar_key: result.pillar_key,
        responses,
        total_score: result.calculated_score || 0,
        category_scores: categoryScores,
        insights: Array.isArray(result.insights) ? 
          result.insights as string[] : 
          typeof result.insights === 'string' ? 
            [result.insights] : [],
        recommendations: [],
        created_at: result.created_at
      };
    } catch (error: any) {
      console.error('Error submitting assessment:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara assessment",
        variant: "destructive"
      });
      return null;
    }
  }, [templates, fetchResults, toast]);

  const getTemplatesByType = useCallback((type: AssessmentTemplate['type']) => {
    return templates.filter(t => t.type === type);
  }, [templates]);

  const getTemplatesByPillar = useCallback((pillarKey: string) => {
    return templates.filter(t => t.pillar_key === pillarKey);
  }, [templates]);

  const getUserResults = useCallback((userId: string) => {
    return results.filter(r => r.user_id === userId);
  }, [results]);

  const getResultsByType = useCallback((type: string) => {
    return results.filter(r => r.assessment_type === type);
  }, [results]);

  const getLatestResult = useCallback((userId: string, type?: string, pillarKey?: string) => {
    const userResults = results.filter(r => {
      if (r.user_id !== userId) return false;
      if (type && r.assessment_type !== type) return false;
      if (pillarKey && r.pillar_key !== pillarKey) return false;
      return true;
    });

    return userResults.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0] || null;
  }, [results]);

  const createCustomTemplate = useCallback(async (template: Omit<AssessmentTemplate, 'id'>) => {
    try {
      // Save to assessment_templates table
      const { data, error } = await supabase
        .from('assessment_templates')
        .insert({
          name: template.name,
          pillar_key: template.pillar_key || '',
          questions: template.questions as any, // Cast to Json for database
          scoring_config: template.scoring_rules as any,
          is_active: template.active,
          created_by: 'current-user' // Would be auth.uid() in real implementation
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchTemplates(); // Refresh templates
      
      toast({
        title: "Mall skapad",
        description: "Assessment mallen har skapats framgångsrikt"
      });

      return { id: data.id, ...template };
    } catch (error: any) {
      console.error('Error creating template:', error);
      toast({
        title: "Fel", 
        description: "Kunde inte skapa assessment mall",
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);

  const deleteResult = useCallback(async (resultId: string) => {
    try {
      const { error } = await supabase
        .from('pillar_assessments')
        .delete()
        .eq('id', resultId);

      if (error) throw error;
      
      await fetchResults(); // Refresh results
      
      toast({
        title: "Resultat borttaget",
        description: "Assessment resultatet har tagits bort"
      });
    } catch (error: any) {
      console.error('Error deleting result:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort resultat",
        variant: "destructive"
      });
    }
  }, [fetchResults, toast]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTemplates(), fetchResults()]);
      setLoading(false);
    };

    loadData();
  }, [fetchTemplates, fetchResults]);

  return {
    templates,
    results,
    loading,
    submitAssessment,
    getTemplatesByType,
    getTemplatesByPillar,
    getUserResults,
    getResultsByType,
    getLatestResult,
    createCustomTemplate,
    deleteResult,
    refetchTemplates: fetchTemplates,
    refetchResults: fetchResults
  };
};