import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * 🚀 STEFAN INTERVENTIONS HOOK - REAL DATA IMPLEMENTATION
 * Ersätter mock data med riktiga Stefan interventions från databasen
 * Integrerar med pillar system och assessment data
 */

export interface StefanIntervention {
  id: string;
  trigger_type: string;
  intervention_type: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  context_data: Record<string, any>;
  ai_analysis?: Record<string, any>;
  user_responded: boolean;
  user_response?: string;
  response_sentiment?: string;
  effectiveness_score?: number;
  created_at: string;
  responded_at?: string;
  updated_at: string;
}

export interface BehaviorAnalytics {
  id: string;
  analysis_type: string;
  behavior_patterns: Record<string, any>;
  insights: Record<string, any>;
  recommendations: Record<string, any>;
  pillar_correlations?: Record<string, any>;
  assessment_integration?: Record<string, any>;
  confidence_score: number;
  generated_at: string;
  expires_at?: string;
  is_active: boolean;
}

export const useStefanInterventions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [interventions, setInterventions] = useState<StefanIntervention[]>([]);
  const [behaviorAnalytics, setBehaviorAnalytics] = useState<BehaviorAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Fetch user's Stefan interventions
  const fetchInterventions = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stefan_interventions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setInterventions((data || []) as StefanIntervention[]);
    } catch (error) {
      console.error('Error fetching Stefan interventions:', error);
      toast({
        title: "Fel vid hämtning",
        description: "Kunde inte hämta Stefan meddelanden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Fetch behavior analytics
  const fetchBehaviorAnalytics = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('stefan_behavior_analytics')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('generated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setBehaviorAnalytics((data || []) as BehaviorAnalytics[]);
    } catch (error) {
      console.error('Error fetching behavior analytics:', error);
    }
  }, [user]);

  // Create new intervention
  const createIntervention = useCallback(async (
    triggerType: string,
    content: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    contextData: Record<string, any> = {}
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('stefan_interventions')
        .insert({
          user_id: user.id,
          trigger_type: triggerType,
          content,
          priority,
          context_data: contextData
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setInterventions(prev => [data as StefanIntervention, ...prev]);
      
      // Log Stefan intervention analytics
      await supabase.from('analytics_metrics').insert({
        user_id: user.id,
        metric_type: 'stefan_intervention_created',
        metric_value: 1,
        metadata: {
          trigger_type: triggerType,
          priority,
          content_length: content.length
        }
      });
      
      toast({
        title: "Stefan meddelande",
        description: content,
        duration: 5000
      });

      return data;
    } catch (error) {
      console.error('Error creating Stefan intervention:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa Stefan meddelande",
        variant: "destructive"
      });
      return null;
    }
  }, [user, toast]);

  // Update user response to intervention
  const updateUserResponse = useCallback(async (
    interventionId: string,
    userResponse: string,
    sentiment?: string
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('stefan_interventions')
        .update({
          user_responded: true,
          user_response: userResponse,
          response_sentiment: sentiment,
          responded_at: new Date().toISOString()
        })
        .eq('id', interventionId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setInterventions(prev => 
        prev.map(intervention => 
          intervention.id === interventionId 
            ? { 
                ...intervention, 
                user_responded: true, 
                user_response: userResponse,
                response_sentiment: sentiment,
                responded_at: new Date().toISOString()
              }
            : intervention
        )
      );

      // Log Stefan response analytics
      await supabase.from('analytics_metrics').insert({
        user_id: user.id,
        metric_type: 'stefan_intervention_response',
        metric_value: userResponse.length,
        metadata: {
          intervention_id: interventionId,
          sentiment: sentiment
        }
      });

      return true;
    } catch (error) {
      console.error('Error updating user response:', error);
      return false;
    }
  }, [user]);

  // Perform comprehensive behavior analysis
  const performBehaviorAnalysis = useCallback(async () => {
    if (!user) return null;

    try {
      setAnalyzing(true);

      // Call Stefan AI analysis edge function with unified orchestrator
      const { data: analysisResult, error } = await supabase.functions.invoke(
        'unified-ai-orchestrator',
        {
          body: {
            action: 'stefan_chat',
            data: {
              message: `Utför en omfattande beteendeanalys för användarens utvecklingsresa`,
              analysisMode: 'comprehensive_behavior',
              includeAssessmentData: true,
              includePillarData: true,
              includeConversationHistory: true
            },
            context: {
              userId: user.id,
              language: 'sv',
              priority: 'high'
            }
          }
        }
      );

      if (error) throw error;

      // Store analysis results
      const { data: behaviorData, error: insertError } = await supabase
        .from('stefan_behavior_analytics')
        .insert({
          user_id: user.id,
          analysis_type: 'comprehensive_behavior',
          behavior_patterns: analysisResult.behavior_patterns || {},
          insights: analysisResult.insights || {},
          recommendations: analysisResult.recommendations || {},
          pillar_correlations: analysisResult.pillar_correlations,
          assessment_integration: analysisResult.assessment_integration,
          confidence_score: analysisResult.confidence_score || 0.5,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Update local state
      setBehaviorAnalytics(prev => [behaviorData as BehaviorAnalytics, ...prev]);

      // Create intervention based on analysis
      if (analysisResult.should_intervene) {
        await createIntervention(
          'behavior_analysis',
          analysisResult.intervention_message,
          analysisResult.intervention_priority || 'medium',
          {
            analysis_id: behaviorData.id,
            analysis_type: 'comprehensive_behavior',
            triggered_by: analysisResult.trigger_reasons
          }
        );
      }

      toast({
        title: "Analys slutförd",
        description: "Stefan har analyserat ditt beteende och skapat nya insikter",
        duration: 5000
      });

      return behaviorData;
    } catch (error) {
      console.error('Error performing behavior analysis:', error);
      toast({
        title: "Analysfel",
        description: "Kunde inte utföra beteendeanalys",
        variant: "destructive"
      });
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, [user, createIntervention, toast]);

  // Get filtered interventions
  const getFilteredInterventions = useCallback((
    timeFilter: 'all' | 'today' | 'week' = 'all',
    priorityFilter?: string
  ) => {
    let filtered = [...interventions];

    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      if (timeFilter === 'today') {
        filterDate.setHours(0, 0, 0, 0);
      } else if (timeFilter === 'week') {
        filterDate.setDate(now.getDate() - 7);
      }

      filtered = filtered.filter(intervention => 
        new Date(intervention.created_at) >= filterDate
      );
    }

    // Priority filter
    if (priorityFilter) {
      filtered = filtered.filter(intervention => 
        intervention.priority === priorityFilter
      );
    }

    return filtered;
  }, [interventions]);

  // Get intervention statistics
  const getInterventionStats = useCallback(() => {
    const total = interventions.length;
    const responded = interventions.filter(i => i.user_responded).length;
    const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;
    
    const priorityStats = {
      urgent: interventions.filter(i => i.priority === 'urgent').length,
      high: interventions.filter(i => i.priority === 'high').length,
      medium: interventions.filter(i => i.priority === 'medium').length,
      low: interventions.filter(i => i.priority === 'low').length
    };

    const avgEffectiveness = interventions
      .filter(i => i.effectiveness_score !== null)
      .reduce((sum, i) => sum + (i.effectiveness_score || 0), 0) / 
      interventions.filter(i => i.effectiveness_score !== null).length || 0;

    return {
      total,
      responded,
      responseRate,
      priorityStats,
      avgEffectiveness: Math.round(avgEffectiveness * 100) / 100
    };
  }, [interventions]);

  // Load data on mount and user change
  useEffect(() => {
    if (user) {
      fetchInterventions();
      fetchBehaviorAnalytics();
    }
  }, [user, fetchInterventions, fetchBehaviorAnalytics]);

  return {
    // Data
    interventions,
    behaviorAnalytics,
    
    // States
    loading,
    analyzing,
    
    // Actions
    createIntervention,
    updateUserResponse,
    performBehaviorAnalysis,
    fetchInterventions,
    fetchBehaviorAnalytics,
    
    // Computed
    getFilteredInterventions,
    getInterventionStats
  };
};