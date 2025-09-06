/**
 * 🧠 NEUROPLASTICITY ENGINE - SPRINT 2 CRITICAL IMPLEMENTATION
 * Implementerar neuroplasticitets-baserade inlärningsmoduler och adaptiv svårighetsgrad
 */

import { supabase } from '@/integrations/supabase/client';

export interface NeuroplasticityProfile {
  userId: string;
  learningVelocity: number; // 0.1-2.0 multiplier
  retentionRate: number; // 0.1-1.0 
  challengeOptimalZone: number; // 1-10 difficulty preference
  motivationalTriggers: string[];
  cognitiveLoad: number; // 1-10 current capacity
  adaptationHistory: AdaptationRecord[];
}

export interface AdaptationRecord {
  timestamp: string;
  pillarType: string;
  difficultyAdjustment: number;
  userResponse: 'success' | 'struggle' | 'mastery';
  neuroplasticGains: number;
}

export interface LearningModule {
  id: string;
  pillarType: string;
  difficultyLevel: number; // 1-10
  neuroplasticPrinciples: string[];
  microHabits: MicroHabit[];
  progressionPath: ProgressionStep[];
  adaptiveElements: AdaptiveElement[];
}

export interface MicroHabit {
  id: string;
  title: string;
  description: string;
  duration: number; // seconds
  neuroplasticBenefit: string;
  repetitionSchedule: RepetitionSchedule;
  difficultyGate: number; // unlock at this difficulty level
}

export interface RepetitionSchedule {
  day1: number;    // repetitions day 1
  day3: number;    // repetitions day 3  
  day7: number;    // repetitions day 7
  day21: number;   // repetitions day 21
  day66: number;   // repetitions day 66 (habit formation complete)
}

export interface ProgressionStep {
  step: number;
  title: string;
  criteria: string;
  neuroplasticMarker: string;
  unlockConditions: string[];
}

export interface AdaptiveElement {
  type: 'difficulty' | 'pace' | 'content' | 'support';
  trigger: string;
  adjustment: string;
  neuroplasticRationale: string;
}

export class NeuroplasticityEngine {
  /**
   * 🎯 GENERATE ADAPTIVE LEARNING MODULE
   */
  static async generateAdaptiveLearningModule(
    userId: string,
    pillarType: string,
    assessmentScores: Record<string, number>
  ): Promise<LearningModule> {
    // Get user's neuroplasticity profile
    const profile = await this.getNeuroplasticityProfile(userId);
    
    // Calculate optimal difficulty based on assessment and profile
    const optimalDifficulty = this.calculateOptimalDifficulty(
      assessmentScores,
      profile
    );

    // Generate micro-habits with neuroplastic progression
    const microHabits = this.generateMicroHabits(pillarType, optimalDifficulty);

    // Create progression pathway
    const progressionPath = this.createProgressionPath(pillarType, optimalDifficulty);

    // Generate adaptive elements
    const adaptiveElements = this.generateAdaptiveElements(pillarType, profile);

    const module: LearningModule = {
      id: `${pillarType}_${Date.now()}`,
      pillarType,
      difficultyLevel: optimalDifficulty,
      neuroplasticPrinciples: this.getNeuroplasticPrinciples(pillarType),
      microHabits,
      progressionPath,
      adaptiveElements
    };

    // Save module to database
    await this.saveLearningModule(userId, module);

    return module;
  }

  /**
   * 🧠 GET NEUROPLASTICITY PROFILE
   */
  private static async getNeuroplasticityProfile(userId: string): Promise<NeuroplasticityProfile> {
    const { data: existing } = await (supabase as any)
      .from('user_neuroplasticity_profiles')
      .select('profile_data')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing?.profile_data) {
      return existing.profile_data as NeuroplasticityProfile;
    }

    // Create initial profile based on defaults
    const initialProfile: NeuroplasticityProfile = {
      userId,
      learningVelocity: 1.0, // normal pace
      retentionRate: 0.7, // average retention
      challengeOptimalZone: 6, // moderate difficulty preference
      motivationalTriggers: ['progress_feedback', 'social_recognition', 'personal_growth'],
      cognitiveLoad: 5, // moderate current capacity
      adaptationHistory: []
    };

    // Save initial profile
    await (supabase as any).from('user_neuroplasticity_profiles').insert({
      user_id: userId,
      profile_data: initialProfile
    });

    return initialProfile;
  }

  /**
   * 📊 CALCULATE OPTIMAL DIFFICULTY
   */
  private static calculateOptimalDifficulty(
    scores: Record<string, number>,
    profile: NeuroplasticityProfile
  ): number {
    const values = Object.values(scores);
    const avgScore = values.length ? values.reduce((sum, score) => sum + score, 0) / values.length : 5;
    
    // Neuroplasticity sweet spot: challenge should be ~20% above current ability
    const baselineDifficulty = Math.max(1, Math.min(10, avgScore + 2));
    
    // Adjust for user's learning profile
    const velocityAdjustment = (profile.learningVelocity - 1.0) * 2;
    const zonePreference = (profile.challengeOptimalZone - 5) * 0.5;
    
    const optimalDifficulty = Math.max(1, Math.min(10, 
      baselineDifficulty + velocityAdjustment + zonePreference
    ));

    return Math.round(optimalDifficulty);
  }

  /**
   * 🎯 GENERATE MICRO-HABITS
   */
  private static generateMicroHabits(pillarType: string, difficulty: number): MicroHabit[] {
    const habitTemplates = this.getMicroHabitTemplates(pillarType);
    
    return habitTemplates
      .filter(template => template.difficultyGate <= difficulty)
      .map(template => ({
        ...template,
        repetitionSchedule: this.calculateRepetitionSchedule(difficulty)
      }));
  }

  /**
   * 📅 CALCULATE REPETITION SCHEDULE
   */
  private static calculateRepetitionSchedule(difficulty: number): RepetitionSchedule {
    // Neuroplasticity research: spaced repetition for habit formation
    const baseReps = Math.max(1, Math.floor(difficulty / 2));
    
    return {
      day1: baseReps * 3,     // Initial intensive practice
      day3: baseReps * 2,     // Consolidation
      day7: baseReps * 2,     // Weekly reinforcement  
      day21: baseReps,        // Habit pathway strengthening
      day66: 1                // Maintenance (habit formed)
    };
  }

  /**
   * 🛤️ CREATE PROGRESSION PATH
   */
  private static createProgressionPath(pillarType: string, difficulty: number): ProgressionStep[] {
    const pathTemplates = this.getProgressionTemplates(pillarType);
    
    return pathTemplates.slice(0, Math.min(difficulty + 2, pathTemplates.length));
  }

  /**
   * 🔄 ADAPT DIFFICULTY REAL-TIME
   */
  static async adaptDifficulty(
    userId: string,
    pillarType: string,
    userResponse: 'success' | 'struggle' | 'mastery',
    currentDifficulty: number
  ): Promise<number> {
    const profile = await this.getNeuroplasticityProfile(userId);
    
    let newDifficulty = currentDifficulty;
    let neuroplasticGains = 0;

    switch (userResponse) {
      case 'mastery':
        // Increase difficulty to maintain neuroplastic challenge
        newDifficulty = Math.min(10, currentDifficulty + 1.5);
        neuroplasticGains = 0.3;
        break;
      case 'success':
        // Slight increase to promote growth
        newDifficulty = Math.min(10, currentDifficulty + 0.5);
        neuroplasticGains = 0.2;
        break;
      case 'struggle':
        // Decrease difficulty to prevent cognitive overload
        newDifficulty = Math.max(1, currentDifficulty - 1);
        neuroplasticGains = 0.1;
        break;
    }

    // Record adaptation
    const adaptationRecord: AdaptationRecord = {
      timestamp: new Date().toISOString(),
      pillarType,
      difficultyAdjustment: newDifficulty - currentDifficulty,
      userResponse,
      neuroplasticGains
    };

    profile.adaptationHistory.push(adaptationRecord);
    
    // Update learning velocity based on adaptation history
    if (profile.adaptationHistory.length >= 5) {
      const recentSuccesses = profile.adaptationHistory
        .slice(-5)
        .filter(record => record.userResponse === 'success' || record.userResponse === 'mastery')
        .length;
      
      profile.learningVelocity = Math.max(0.5, Math.min(2.0, 
        0.8 + (recentSuccesses / 5) * 0.8
      ));
    }

    // Save updated profile
    await (supabase as any)
      .from('user_neuroplasticity_profiles')
      .upsert({
        user_id: userId,
        profile_data: profile,
        updated_at: new Date().toISOString()
      });

    return Math.round(newDifficulty);
  }

  /**
   * 📈 TRACK NEUROPLASTIC PROGRESS
   */
  static async trackNeuroplasticProgress(
    userId: string,
    pillarType: string,
    activityType: string,
    completionData: Record<string, any>
  ): Promise<void> {
    await (supabase as any).from('neuroplastic_progress_tracking').insert({
      user_id: userId,
      pillar_type: pillarType,
      activity_type: activityType,
      completion_data: completionData,
      neuroplastic_markers: {
        consistency_score: completionData.consistency || 0,
        difficulty_progression: completionData.difficultyIncrease || 0,
        retention_indicators: completionData.retention || 0,
        transfer_learning: completionData.transfer || 0
      }
    });
  }

  // Helper methods for templates
  private static getMicroHabitTemplates(pillarType: string): MicroHabit[] {
    const templates: Record<string, MicroHabit[]> = {
      self_care: [
        {
          id: 'breathing_2min',
          title: '2-minuters andningsövning',
          description: 'Djup andning för stress-minskning och fokus',
          duration: 120,
          neuroplasticBenefit: 'Stärker prefrontal cortex och minskar amygdala-aktivering',
          repetitionSchedule: { day1: 3, day3: 2, day7: 2, day21: 1, day66: 1 },
          difficultyGate: 1
        },
        {
          id: 'gratitude_practice',
          title: 'Tacksamhets-reflektion',
          description: 'Identifiera 3 saker du är tacksam för',
          duration: 180,
          neuroplasticBenefit: 'Aktiverar belöningscentra och bygger positiva neurala pathways',
          repetitionSchedule: { day1: 2, day3: 2, day7: 1, day21: 1, day66: 1 },
          difficultyGate: 2
        }
      ],
      skills: [
        {
          id: 'skill_micro_practice',
          title: '5-minuters färdighetsträning',
          description: 'Fokuserad övning på en specifik färdighet',
          duration: 300,
          neuroplasticBenefit: 'Bygger myelinisering genom repetitiv, fokuserad träning',
          repetitionSchedule: { day1: 2, day3: 2, day7: 2, day21: 1, day66: 1 },
          difficultyGate: 3
        }
      ]
    };

    return templates[pillarType] || [];
  }

  private static getProgressionTemplates(pillarType: string): ProgressionStep[] {
    const templates: Record<string, ProgressionStep[]> = {
      self_care: [
        {
          step: 1,
          title: 'Grundläggande medvetenhet',
          criteria: 'Kan identifiera stress-signaler',
          neuroplasticMarker: 'Ökad interoceptiv känslighet',
          unlockConditions: ['Genomför andningsövning 5 dagar i rad']
        },
        {
          step: 2,
          title: 'Aktiv reglering',
          criteria: 'Kan använda andningstekniker vid stress',
          neuroplasticMarker: 'Stärkt vagusnerv-aktivering',
          unlockConditions: ['Använd andningsteknik i stressful situation 3 gånger']
        }
      ]
    };

    return templates[pillarType] || [];
  }

  private static generateAdaptiveElements(pillarType: string, profile: NeuroplasticityProfile): AdaptiveElement[] {
    return [
      {
        type: 'difficulty',
        trigger: 'User completes exercises too easily',
        adjustment: 'Increase complexity by 25%',
        neuroplasticRationale: 'Maintain optimal challenge zone for continued neural growth'
      },
      {
        type: 'pace',
        trigger: 'User shows signs of cognitive overload',
        adjustment: 'Reduce daily requirements by 30%',
        neuroplasticRationale: 'Prevent stress-induced cortisol from inhibiting learning'
      }
    ];
  }

  private static getNeuroplasticPrinciples(pillarType: string): string[] {
    return [
      'Spaced repetition för långsiktig minnesbildning',
      'Progressiv överbelastning för neural adaptation',
      'Multisensorisk inlärning för starkare pathways',
      'Mindful practice för fokuserad neuroplasticitet'
    ];
  }

  private static async saveLearningModule(userId: string, module: LearningModule): Promise<void> {
    await (supabase as any).from('neuroplastic_learning_modules').insert({
      user_id: userId,
      module_data: module,
      created_at: new Date().toISOString()
    });
  }
}
