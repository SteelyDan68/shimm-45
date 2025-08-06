// Neuroplasticitetsbaserad klientresa-arkitektur
export type JourneyIntensity = 'introduction' | 'moderate' | 'transformation';
export type JourneyDuration = 28 | 42 | 66; // dagar

export interface NeuroplasticityJourney {
  id: string;
  user_id: string;
  journey_type: 'self_care' | 'skills' | 'talent' | 'brand' | 'economy' | 'holistic';
  intensity: JourneyIntensity;
  duration_days: JourneyDuration;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  
  // Neuroplastisk progression
  neuroplasticity_phase: 'preparation' | 'action' | 'maintenance' | 'mastery';
  habit_formation_data: HabitFormationMetrics;
  
  // AI-genererade actionables
  daily_actions: DailyAction[];
  weekly_reflections: WeeklyReflection[];
  milestone_checkpoints: MilestoneCheckpoint[];
  
  // Evidensbaserad anpassning
  adaptation_triggers: AdaptationTrigger[];
  success_metrics: SuccessMetrics;
}

export interface HabitFormationMetrics {
  streak_count: number;
  consistency_rate: number; // 0-1
  neural_pathway_strength: number; // 1-10 baserat på repetition och kvalitet
  optimal_reminder_times: string[]; // ["07:00", "12:00", "19:00"]
  environmental_cues: string[];
  reward_mechanisms: string[];
}

export interface DailyAction {
  id: string;
  day_number: number; // 1-66
  action_type: 'micro_habit' | 'practice' | 'reflection' | 'challenge';
  title: string;
  description: string;
  estimated_minutes: number;
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  neuroplasticity_focus: string; // "repetition", "variation", "challenge", "consolidation"
  
  // Completion tracking
  completed_at?: string;
  quality_rating?: number; // 1-10
  user_notes?: string;
  environmental_factors?: string[];
}

export interface WeeklyReflection {
  week_number: number;
  reflection_prompts: string[];
  wheel_of_life_scores: Record<string, number>; // 8 livsområden
  energy_levels: number[]; // dagliga värden 1-10
  stress_levels: number[]; // dagliga värden 1-10
  key_insights: string;
  adaptation_needs: string[];
}

export interface MilestoneCheckpoint {
  day: number; // t.ex. 7, 14, 21, 30, 45, 66
  checkpoint_type: 'assessment' | 'celebration' | 'recalibration';
  neural_consolidation_score: number; // 1-10
  habit_strength_indicators: string[];
  next_phase_recommendations: string[];
}

export interface AdaptationTrigger {
  trigger_type: 'low_consistency' | 'high_stress' | 'rapid_progress' | 'plateau';
  detected_at: string;
  adaptation_made: string;
  ai_reasoning: string;
}

export interface SuccessMetrics {
  baseline_assessment_scores: Record<string, number>;
  current_assessment_scores: Record<string, number>;
  behavioral_indicators: string[];
  subjective_wellbeing_trend: number[]; // veckovis 1-10
  goal_achievement_rate: number; // 0-1
}

// Container för klientdata som AI kan använda
export interface ClientDataContainer {
  user_id: string;
  
  // Primär assessment-data
  pillar_assessments: Record<string, any>;
  wheel_of_life_scores: Record<string, number>;
  
  // Personlighets- och kontextdata  
  personality_profile: PersonalityProfile;
  life_context: LifeContext;
  resource_inventory: ResourceInventory;
  
  // Historisk data för mönsteranalys
  journey_history: NeuroplasticityJourney[];
  behavioral_patterns: BehavioralPattern[];
  
  // AI prompt-optimering
  prompt_personalization_data: PromptPersonalizationData;
  
  // Metadata för systemanvändning
  created_at: string;
  last_updated: string;
  data_version: string;
}

export interface PersonalityProfile {
  learning_style: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing';
  motivation_drivers: string[]; // intrinsic, achievement, social, etc.
  stress_response_patterns: string[];
  communication_preferences: string[];
  decision_making_style: string;
}

export interface LifeContext {
  life_phase: 'exploration' | 'establishment' | 'transition' | 'mastery';
  major_life_events: string[];
  current_challenges: string[];
  support_system_strength: number; // 1-10
  time_availability: 'limited' | 'moderate' | 'flexible';
  energy_patterns: string[]; // morning person, evening person, etc.
}

export interface ResourceInventory {
  financial_resources: 'limited' | 'adequate' | 'abundant';
  time_resources: 'constrained' | 'moderate' | 'flexible';
  social_resources: string[]; // specific support people/groups
  knowledge_resources: string[]; // areas of expertise
  practical_resources: string[]; // tools, space, technology access
  emotional_resources: string[]; // coping strategies, resilience factors
}

export interface BehavioralPattern {
  pattern_type: 'habit' | 'trigger_response' | 'avoidance' | 'success_strategy';
  description: string;
  frequency: 'daily' | 'weekly' | 'situational';
  effectiveness: number; // 1-10
  context_dependent: boolean;
  identified_at: string;
}

export interface PromptPersonalizationData {
  preferred_communication_tone: 'supportive' | 'challenging' | 'analytical' | 'creative';
  effective_motivation_language: string[];
  resonant_metaphors: string[];
  cultural_context_factors: string[];
  language_complexity_preference: 'simple' | 'moderate' | 'complex';
  
  // AI-lärda preferenser
  response_length_preference: 'brief' | 'detailed' | 'comprehensive';
  actionable_granularity: 'micro' | 'standard' | 'macro';
  feedback_sensitivity: number; // 1-10
}