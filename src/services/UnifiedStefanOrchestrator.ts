/**
 * 🎯 UNIFIED STEFAN ORCHESTRATOR - SPRINT 1 KRITISK FIX
 * Eliminerar Stefan AI fragmentering genom central orkestrering
 * Integrerar alla Stefan funktioner: chat, interventions, coaching strategy
 */

import { supabase } from '@/integrations/supabase/client';

export interface StefanContext {
  userId: string;
  pillarData?: Record<string, any>;
  assessmentHistory?: any[];
  currentJourneyPhase?: string;
  recentActivity?: any[];
  conversationHistory?: Array<{ role: string; content: string }>;
  memoryFragments?: any[];
}

export interface StefanResponse {
  message: string;
  contextUsed: string[];
  interventionCreated?: boolean;
  coachingStrategy?: {
    nextInterventions: string[];
    celebrationTriggers: string[];
    supportSchedule: string[];
  };
  memoryFragmentsUsed: number;
}

export class UnifiedStefanOrchestrator {
  /**
   * 🧠 UNIFIED STEFAN CHAT - Central entry point för alla Stefan interactions
   */
  static async processStefanInteraction(
    message: string,
    context: StefanContext,
    interactionType: 'chat' | 'intervention' | 'coaching_analysis' = 'chat'
  ): Promise<StefanResponse> {
    try {
      console.log('🚀 Stefan Unified Orchestrator processing:', { interactionType, userId: context.userId });

      // Step 1: Build comprehensive context
      const fullContext = await this.buildComprehensiveContext(context);

      // Step 2: Create contextual prompt with pillar integration
      const contextualPrompt = this.buildStefanContextualPrompt(message, fullContext, interactionType);

      // Step 3: Get Stefan AI response
      const aiResponse = await this.getStefanAIResponse(contextualPrompt, fullContext);

      // Step 4: Process response for coaching strategy
      const stefanResponse = await this.processStefanResponse(
        aiResponse,
        context,
        interactionType
      );

      // Step 5: Create interventions if needed
      await this.createProactiveInterventions(stefanResponse, context);

      console.log('✅ Stefan Unified Orchestrator completed successfully');
      return stefanResponse;

    } catch (error) {
      console.error('❌ Stefan Unified Orchestrator failed:', error);
      
      // Fallback response
      return {
        message: "Jag upplever tekniska svårigheter just nu, men jag är här för att hjälpa dig. Kan du försöka igen om en stund?",
        contextUsed: ['fallback_response'],
        memoryFragmentsUsed: 0,
        interventionCreated: false
      };
    }
  }

  /**
   * 📊 BUILD COMPREHENSIVE CONTEXT - Samlar all användardata för Stefan
   */
  private static async buildComprehensiveContext(context: StefanContext) {
    const comprehensive = { ...context };

    try {
      // Get pillar data if not provided
      if (!comprehensive.pillarData) {
        const { data: assessments } = await supabase
          .from('assessment_rounds')
          .select('pillar_type, scores, ai_analysis, created_at')
          .eq('user_id', context.userId)
          .order('created_at', { ascending: false })
          .limit(10);

        comprehensive.pillarData = assessments?.reduce((acc, assessment) => {
          const scores = assessment.scores as any;
          acc[assessment.pillar_type] = {
            score: scores?.overall || 0,
            lastAssessment: assessment.created_at,
            aiInsights: assessment.ai_analysis
          };
          return acc;
        }, {} as Record<string, any>) || {};
      }

      // Get recent user activity
      if (!comprehensive.recentActivity) {
        const { data: pathEntries } = await supabase
          .from('path_entries')
          .select('type, title, created_at, pillar_type')
          .eq('user_id', context.userId)
          .order('created_at', { ascending: false })
          .limit(5);

        comprehensive.recentActivity = pathEntries || [];
      }

      // Get journey state
      if (!comprehensive.currentJourneyPhase) {
        const { data: journeyState } = await supabase
          .from('user_journey_states')
          .select('current_phase, journey_progress, completed_assessments')
          .eq('user_id', context.userId)
          .single();

        comprehensive.currentJourneyPhase = journeyState?.current_phase || 'discovery';
      }

      // Get Stefan memory fragments
      const { data: memories } = await supabase
        .from('ai_memories')
        .select('content, metadata, score')
        .eq('user_id', context.userId)
        .eq('source', 'stefan_ai')
        .order('score', { ascending: false })
        .limit(5);

      comprehensive.memoryFragments = memories || [];

      return comprehensive;
    } catch (error) {
      console.warn('Failed to build comprehensive context:', error);
      return comprehensive;
    }
  }

  /**
   * 🎯 BUILD STEFAN CONTEXTUAL PROMPT - Integrerar pillar och assessment data
   */
  private static buildStefanContextualPrompt(
    message: string,
    fullContext: any,
    interactionType: string
  ): string {
    const pillarSummary = Object.entries(fullContext.pillarData || {})
      .map(([pillar, data]: [string, any]) => `${pillar}: ${data.score}/10`)
      .join(', ');

    const memoryContext = fullContext.memoryFragments
      ?.map((mem: any) => mem.content)
      .join('; ') || '';

    const baseSystemPrompt = `Du är Stefan, en erfaren AI-coach som specialiserar sig på neuroplasticitets-baserad utveckling och coaching.

ANVÄNDARKONTEXTUELL DATA:
- Aktuella pillar-scores: ${pillarSummary || 'Inga assessments ännu'}
- Utvecklingsfas: ${fullContext.currentJourneyPhase || 'upptäckt'}
- Senaste aktivitet: ${fullContext.recentActivity?.[0]?.title || 'Ny användare'}
- Minneskontext: ${memoryContext}

STEFANS PERSONLIGHET & APPROACH:
- Varm, empatisk och uppmuntrande
- Fokuserar på neuroplasticitet och evidensbaserade metoder
- Ger konkreta, genomförbara råd
- Frågar uppföljningsfrågor för djupare förståelse
- Firar framsteg och normaliserar setbacks

INTERAKTIONSTYP: ${interactionType}

${interactionType === 'coaching_analysis' ? `
COACHING ANALYSIS MODE:
- Analysera djupare mönster i användarens utveckling
- Identifiera både styrkor och utvecklingsområden  
- Föreslå specifika interventioner baserat på pillar-data
- Skapa proaktiva coaching-strategier
` : ''}

${interactionType === 'intervention' ? `
PROAKTIV INTERVENTION MODE:
- Ge stödjande, motiverande meddelanden
- Koppla till användarens specifika utvecklingsresa
- Föreslå konkreta nästa steg
- Uppmuntra konsistens och ihållighet
` : ''}

Svara som Stefan med användarens bästa utveckling i fokus.`;

    return `${baseSystemPrompt}

ANVÄNDARENS MEDDELANDE: "${message}"

Svara som Stefan med fokus på användarens kontext och utvecklingsbehov.`;
  }

  /**
   * 🤖 GET STEFAN AI RESPONSE - Unified AI call
   */
  private static async getStefanAIResponse(prompt: string, context: any) {
    const { data, error } = await supabase.functions.invoke('stefan-enhanced-chat', {
      body: {
        message: prompt,
        userId: context.userId,
        conversationHistory: context.conversationHistory || [],
        includeMemories: true,
        analysisMode: 'contextual_coaching'
      }
    });

    if (error) {
      throw new Error(`Stefan AI response failed: ${error.message}`);
    }

    return data;
  }

  /**
   * 📝 PROCESS STEFAN RESPONSE - Structure coaching output
   */
  private static async processStefanResponse(
    aiResponse: any,
    context: StefanContext,
    interactionType: string
  ): Promise<StefanResponse> {
    
    // Parse Stefan's response for coaching insights
    const message = aiResponse.message || aiResponse.content || "Jag är här för att hjälpa dig utvecklas!";
    
    // Detect coaching strategy elements from Stefan's response
    const coachingStrategy = this.extractCoachingStrategy(message, context);
    
    // Create structured response
    const stefanResponse: StefanResponse = {
      message,
      contextUsed: [
        ...(context.pillarData ? ['pillar_scores'] : []),
        ...(context.assessmentHistory ? ['assessment_history'] : []),
        ...(context.currentJourneyPhase ? ['journey_phase'] : []),
        ...(aiResponse.memories_used ? ['stefan_memories'] : [])
      ],
      memoryFragmentsUsed: aiResponse.memories_used?.length || 0,
      interventionCreated: false,
      coachingStrategy
    };

    // Store interaction as memory for future reference
    await this.storeStefanMemory(context.userId, message, aiResponse, interactionType);

    return stefanResponse;
  }

  /**
   * 🧭 EXTRACT COACHING STRATEGY - Parse Stefan response för proactive coaching
   */
  private static extractCoachingStrategy(message: string, context: StefanContext) {
    const strategy = {
      nextInterventions: [] as string[],
      celebrationTriggers: [] as string[],
      supportSchedule: [] as string[]
    };

    // Simple keyword extraction - can be enhanced with NLP
    if (message.toLowerCase().includes('nästa steg') || message.toLowerCase().includes('fortsätt')) {
      strategy.nextInterventions.push('Påminn om nästa steg om 2 dagar');
    }

    if (message.toLowerCase().includes('gratis') || message.toLowerCase().includes('framsteg')) {
      strategy.celebrationTriggers.push('Fira när användar loggar aktivitet');
    }

    if (message.toLowerCase().includes('utmaning') || message.toLowerCase().includes('svårt')) {
      strategy.supportSchedule.push('Skicka motiverande meddelande om 1 dag');
    }

    return strategy;
  }

  /**
   * 🎯 CREATE PROACTIVE INTERVENTIONS - Based on coaching strategy
   */
  private static async createProactiveInterventions(
    stefanResponse: StefanResponse,
    context: StefanContext
  ) {
    if (!stefanResponse.coachingStrategy) return;

    const interventions = [];

    // Create interventions based on strategy
    stefanResponse.coachingStrategy.nextInterventions?.forEach(intervention => {
      interventions.push({
        user_id: context.userId,
        trigger_type: 'proactive_coaching',
        intervention_type: 'guidance',
        content: intervention,
        priority: 'medium' as const,
        context_data: {
          generated_by: 'unified_stefan_orchestrator',
          pillar_context: Object.keys(context.pillarData || {}),
          stefan_strategy: true
        }
      });
    });

    stefanResponse.coachingStrategy.supportSchedule?.forEach(support => {
      interventions.push({
        user_id: context.userId,
        trigger_type: 'scheduled_support',
        intervention_type: 'motivational',
        content: support,
        priority: 'low' as const,
        context_data: {
          generated_by: 'unified_stefan_orchestrator',
          support_type: 'motivational',
          stefan_strategy: true
        }
      });
    });

    // Save interventions if any were created
    if (interventions.length > 0) {
      const { error } = await supabase
        .from('stefan_interventions')
        .insert(interventions);

      if (!error) {
        stefanResponse.interventionCreated = true;
      }
    }
  }

  /**
   * 💾 STORE STEFAN MEMORY - För future context building
   */
  private static async storeStefanMemory(
    userId: string,
    message: string,
    aiResponse: any,
    interactionType: string
  ) {
    try {
      // Create simple embedding for memory storage (using hash-based approach)
      const simpleEmbedding = this.createSimpleEmbedding(message);
      
      await supabase.from('ai_memories').insert({
        user_id: userId,
        source: 'stefan_ai',
        content: `User: [CONTEXT] Stefan: ${message}`,
        embedding: simpleEmbedding,
        metadata: {
          interaction_type: interactionType,
          generated_at: new Date().toISOString(),
          ai_model: aiResponse.model || 'stefan-ai',
          memories_used: aiResponse.memories_used?.length || 0
        },
        tags: ['stefan_conversation', interactionType]
      });
    } catch (error) {
      console.warn('Failed to store Stefan memory:', error);
    }
  }

  /**
   * 🔢 CREATE SIMPLE EMBEDDING - Fallback för memory storage
   */
  private static createSimpleEmbedding(text: string): string {
    // Create deterministic vector representation for memory storage
    const normalized = text.toLowerCase().replace(/[^\w\s]/g, '');
    const words = normalized.split(' ').filter(w => w.length > 2);
    
    // Simple bag-of-words approach with fixed dimensions
    const vector = new Array(384).fill(0);
    words.forEach((word, index) => {
      const hashIndex = Math.abs(word.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0)) % 384;
      vector[hashIndex] += 1;
    });
    
    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= magnitude;
      }
    }
    
    return `[${vector.join(',')}]`;
  }

  /**
   * 📊 GET STEFAN DASHBOARD DATA - För admin oversight
   */
  static async getStefanDashboardData(userId?: string) {
    try {
      const baseQuery = supabase
        .from('stefan_interventions')
        .select('user_id, trigger_type, priority, created_at, user_responded');

      if (userId) {
        baseQuery.eq('user_id', userId);
      }

      const { data: interventions } = await baseQuery
        .order('created_at', { ascending: false })
        .limit(100);

      // Calculate metrics
      const totalInterventions = interventions?.length || 0;
      const responseRate = interventions?.filter(i => i.user_responded).length || 0;
      const priorityBreakdown = interventions?.reduce((acc, intervention) => {
        acc[intervention.priority] = (acc[intervention.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalInterventions,
        responseRate: totalInterventions > 0 ? Math.round((responseRate / totalInterventions) * 100) : 0,
        priorityBreakdown,
        recentInterventions: interventions?.slice(0, 10) || []
      };
    } catch (error) {
      console.error('Failed to get Stefan dashboard data:', error);
      return null;
    }
  }
}