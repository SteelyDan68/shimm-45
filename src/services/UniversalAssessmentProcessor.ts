/**
 * 🎯 UNIVERSAL ASSESSMENT PROCESSOR - SPRINT 1 KRITISK FIX
 * Fixar den brutna assessment→AI→output pipeline som identifierades i auditen
 * Skapar unified data flow mellan assessment, AI-analys och pedagogisk output
 */

import { supabase } from '@/integrations/supabase/client';
import { buildLovableAIPrompt } from '@/utils/aiPromptBuilder';

export interface AssessmentInput {
  userId: string;
  pillarType: string;
  assessmentData: Record<string, any>;
  scores: Record<string, number>;
  clientContext?: any;
  comments?: string;
}

export interface PedagogicalOutput {
  analysis: string;
  pedagogicalGuidance: {
    weeklyGoals: string[];
    dailyMicroHabits: string[];
    neuroplasticPrinciples: string[];
    progressMeasurement: string[];
    nextMilestones: string[];
  };
  actionPlan: {
    immediate: string[];
    week1: string[];
    week2: string[];
    month1: string[];
  };
  stefanCoachingStrategy: {
    interventionTriggers: string[];
    supportMessages: string[];
    celebrationMoments: string[];
  };
}

export class UniversalAssessmentProcessor {
  /**
   * 🎯 MAIN PROCESSOR: Hela assessment→AI→pedagogisk output pipeline
   */
  static async processAssessmentToPedagogicalOutput(
    input: AssessmentInput
  ): Promise<{ success: boolean; output?: PedagogicalOutput; error?: string }> {
    try {
      console.log('🚀 Starting Universal Assessment Processing for user:', input.userId);

      // Step 1: Get user context for personalized prompting
      const userContext = await this.getUserContextData(input.userId);
      
      // Step 2: Build contextual AI prompt using existing system
      const contextualPrompt = this.buildContextualAssessmentPrompt(
        input,
        userContext
      );

      // Step 3: Get AI analysis with pedagogical focus
      const aiAnalysis = await this.getAIPedagogicalAnalysis(contextualPrompt);

      // Step 4: Structure output as pedagogical guidance
      const pedagogicalOutput = this.structurePedagogicalOutput(aiAnalysis);

      // Step 5: Save to unified data architecture
      const assessmentRound = await this.saveToUnifiedArchitecture(input, pedagogicalOutput);

      // Step 6: Create Stefan coaching strategy
      await this.createStefanCoachingStrategy(input.userId, input.pillarType, pedagogicalOutput);

      console.log('✅ Universal Assessment Processing completed:', assessmentRound.id);

      return { success: true, output: pedagogicalOutput };

    } catch (error) {
      console.error('❌ Universal Assessment Processing failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown processing error' 
      };
    }
  }

  /**
   * 📊 GET USER CONTEXT DATA - För personaliserad AI-prompting
   */
  private static async getUserContextData(userId: string) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, profile_metadata')
      .eq('id', userId)
      .single();

    const { data: previousAssessments } = await supabase
      .from('assessment_rounds')
      .select('pillar_type, scores, ai_analysis')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    const { data: userJourney } = await supabase
      .from('user_journey_states')
      .select('current_phase, completed_assessments, journey_progress')
      .eq('user_id', userId)
      .single();

    return {
      profile: profile?.profile_metadata || {},
      previousAssessments: previousAssessments || [],
      journeyState: userJourney || {},
      email: profile?.email
    };
  }

  /**
   * 🧠 BUILD CONTEXTUAL PROMPT - Använder befintlig prompt builder men med pedagogisk fokus
   */
  private static buildContextualAssessmentPrompt(
    input: AssessmentInput,
    userContext: any
  ): string {
    const basePrompt = `Du är en världsledande AI-coach som specialiserar dig på PEDAGOGISK, SJÄLVINSTRUERANDE utvecklingsvägledning.

Din uppgift är att transformera assessment-data till konkret, neuroplasticitets-baserad handlingsplan.

ANVÄNDARKONTEXT:
${userContext.profile?.primär_roll ? `Primär roll: ${userContext.profile.primär_roll}` : ''}
${userContext.profile?.nisch ? `Nisch: ${userContext.profile.nisch}` : ''}
${userContext.journeyState?.current_phase ? `Aktuell fas: ${userContext.journeyState.current_phase}` : ''}
${userContext.previousAssessments?.length ? `Tidigare assessments: ${userContext.previousAssessments.length} genomförda` : 'Första assessment'}

ASSESSMENT DATA ATT ANALYSERA:
Pillar: ${input.pillarType}
Scores: ${JSON.stringify(input.scores, null, 2)}
Svar: ${JSON.stringify(input.assessmentData, null, 2)}
${input.comments ? `Kommentarer: ${input.comments}` : ''}

CRITICAL REQUIREMENT: Din output MÅSTE vara SJÄLVINSTRUERANDE och PEDAGOGISK.

Strukturera ditt svar enligt följande JSON-format:
{
  "analysis": "Djup analys av nuläge och utvecklingspotential",
  "pedagogicalGuidance": {
    "weeklyGoals": ["Konkreta veckomål med tydlig neuroplastisk grund"],
    "dailyMicroHabits": ["Specifika 2-15min dagliga aktiviteter"],
    "neuroplasticPrinciples": ["Förklaringar av VARFÖR dessa aktiviteter fungerar"],
    "progressMeasurement": ["Hur användaren mäter framsteg konkret"],
    "nextMilestones": ["När och hur de vet att de är redo för nästa steg"]
  },
  "actionPlan": {
    "immediate": ["Åtgärder att börja idag"],
    "week1": ["Mål för första veckan"],  
    "week2": ["Utveckling andra veckan"],
    "month1": ["Månadsmål och utvärdering"]
  },
  "stefanCoachingStrategy": {
    "interventionTriggers": ["När Stefan ska skicka support-meddelanden"],
    "supportMessages": ["Förslag på motiverande meddelanden"],
    "celebrationMoments": ["När och hur framsteg ska firas"]
  }
}

Svara ENDAST med giltig JSON. Var konkret, specifik och anpassa till användarens livssituation.`;

    return basePrompt;
  }

  /**
   * 🤖 GET AI PEDAGOGICAL ANALYSIS
   */
  private static async getAIPedagogicalAnalysis(prompt: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('universal-assessment-analyzer', {
      body: {
        template_id: 'pedagogical_analysis',
        client_id: 'universal_processor',
        answers: { analysis_request: prompt },
        calculated_scores: { overall: 1 },
        context: 'pedagogical_processing'
      }
    });

    if (error) {
      throw new Error(`AI Analysis failed: ${error.message}`);
    }

    // Try to parse JSON response
    try {
      return JSON.parse(data.analysis);
    } catch (parseError) {
      // Fallback: structure raw text response
      return {
        analysis: data.analysis,
        pedagogicalGuidance: {
          weeklyGoals: ["Börja med små steg enligt neuroplasticitets-principerna"],
          dailyMicroHabits: ["Implementera 2-minuters regeln för vanebildning"],
          neuroplasticPrinciples: ["Konsistens över intensitet för neural pathway-bildning"],
          progressMeasurement: ["Dokumentera dagliga framsteg i enkelt format"],
          nextMilestones: ["Utvärdera efter 21 dagar för vanebildnings-momentum"]
        },
        actionPlan: {
          immediate: ["Starta med en mikroaktivitet idag"],
          week1: ["Etablera daglig rutin"],
          week2: ["Öka komplexiteten gradvis"],
          month1: ["Utvärdera och anpassa strategin"]
        },
        stefanCoachingStrategy: {
          interventionTriggers: ["Vid 3 dagars inaktivitet", "När veckomål uppnås"],
          supportMessages: ["Påminn om neuroplastiska fördelar", "Fira små vinster"],
          celebrationMoments: ["Varje 7:e dag av konsistens", "Vid milstolps-uppnåelse"]
        }
      };
    }
  }

  /**
   * 📚 STRUCTURE PEDAGOGICAL OUTPUT
   */
  private static structurePedagogicalOutput(aiResponse: any): PedagogicalOutput {
    // Ensure all required fields exist with sensible defaults
    return {
      analysis: aiResponse.analysis || "AI-analys genomförd",
      pedagogicalGuidance: {
        weeklyGoals: aiResponse.pedagogicalGuidance?.weeklyGoals || ["Etablera grundläggande rutiner"],
        dailyMicroHabits: aiResponse.pedagogicalGuidance?.dailyMicroHabits || ["Starta med 2-minuters aktiviteter"],
        neuroplasticPrinciples: aiResponse.pedagogicalGuidance?.neuroplasticPrinciples || ["Repetition skapar neurala pathways"],
        progressMeasurement: aiResponse.pedagogicalGuidance?.progressMeasurement || ["Daglig checklistor"],
        nextMilestones: aiResponse.pedagogicalGuidance?.nextMilestones || ["Utvärdera efter 21 dagar"]
      },
      actionPlan: {
        immediate: aiResponse.actionPlan?.immediate || ["Börja idag med första steget"],
        week1: aiResponse.actionPlan?.week1 || ["Etablera daglig rutin"],
        week2: aiResponse.actionPlan?.week2 || ["Öka komplexitet gradvis"],
        month1: aiResponse.actionPlan?.month1 || ["Utvärdera och anpassa"]
      },
      stefanCoachingStrategy: {
        interventionTriggers: aiResponse.stefanCoachingStrategy?.interventionTriggers || ["Vid inaktivitet", "Vid framsteg"],
        supportMessages: aiResponse.stefanCoachingStrategy?.supportMessages || ["Motiverande påminnelser"],
        celebrationMoments: aiResponse.stefanCoachingStrategy?.celebrationMoments || ["Vecko-framsteg firas"]
      }
    };
  }

  /**
   * 💾 SAVE TO UNIFIED ARCHITECTURE - Single source of truth
   */
  private static async saveToUnifiedArchitecture(
    input: AssessmentInput,
    output: PedagogicalOutput
  ) {
    // Primary storage: assessment_rounds (single source of truth)
    const { data: assessmentRound, error: roundError } = await supabase
      .from('assessment_rounds')
      .insert({
        user_id: input.userId,
        created_by: input.userId,
        pillar_type: input.pillarType,
        answers: input.assessmentData,
        scores: { 
          ...input.scores, 
          overall: Object.values(input.scores).reduce((sum, val) => sum + val, 0) / Object.values(input.scores).length 
        },
        comments: input.comments || '',
        ai_analysis: JSON.stringify(output, null, 2)
      })
      .select()
      .single();

    if (roundError) {
      throw new Error(`Failed to save assessment round: ${roundError.message}`);
    }

    // Legacy compatibility: Create path_entry
    await supabase.from('path_entries').insert({
      user_id: input.userId,
      created_by: input.userId,
      type: 'assessment',
      pillar_type: input.pillarType,
      title: `${input.pillarType} Bedömning Slutförd`,
      details: output.analysis,
      content: JSON.stringify(output.pedagogicalGuidance),
      status: 'completed',
      ai_generated: true,
      visible_to_client: true,
      metadata: {
        assessment_round_id: assessmentRound.id,
        processing_method: 'universal_processor',
        has_pedagogical_output: true
      }
    });

    return assessmentRound;
  }

  /**
   * 🎯 CREATE STEFAN COACHING STRATEGY
   */
  private static async createStefanCoachingStrategy(
    userId: string,
    pillarType: string,
    output: PedagogicalOutput
  ) {
    // Create initial Stefan interventions based on strategy
    const interventions = [
      {
        user_id: userId,
        trigger_type: 'assessment_completion',
        intervention_type: 'congratulatory',
        content: `Grattis! Du har slutfört din ${pillarType} bedömning. Jag har skapat en personlig utvecklingsplan åt dig. Första steget: ${output.actionPlan.immediate[0] || 'Börja med små steg idag!'}`,
        priority: 'high',
        context_data: {
          pillar_type: pillarType,
          generated_from: 'universal_assessment_processor',
          pedagogical_focus: output.pedagogicalGuidance.weeklyGoals[0]
        }
      }
    ];

    // Add trigger-based interventions
    output.stefanCoachingStrategy.interventionTriggers.forEach((trigger, index) => {
      interventions.push({
        user_id: userId,
        trigger_type: 'scheduled_support',
        intervention_type: 'motivational',
        content: output.stefanCoachingStrategy.supportMessages[index] || 'Du gör framsteg! Fortsätt med dina dagliga micro-habits.',
        priority: 'medium',
        context_data: {
          pillar_type: pillarType,
          generated_from: 'universal_assessment_processor',
          pedagogical_focus: output.pedagogicalGuidance.neuroplasticPrinciples[0] || 'Neuroplastisk utveckling'
        }
      });
    });

    // Save interventions
    const { error: interventionError } = await supabase
      .from('stefan_interventions')
      .insert(interventions);

    if (interventionError) {
      console.warn('Failed to create Stefan interventions:', interventionError);
    }

    // Log successful coaching strategy creation
    await supabase.from('analytics_metrics').insert({
      user_id: userId,
      metric_type: 'stefan_coaching_strategy_created',
      metric_value: interventions.length,
      metadata: {
        pillar_type: pillarType,
        processing_method: 'universal_assessment_processor',
        intervention_count: interventions.length
      }
    });
  }
}