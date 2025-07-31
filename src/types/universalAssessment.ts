export type AssessmentContext = 'onboarding' | 'pillar' | 'check_in' | 'progress_review';
export type AssessmentType = 'scale' | 'boolean' | 'multiple_choice' | 'text' | 'textarea' | 'slider';

export interface UniversalQuestion {
  id: string;
  key: string;
  text: string;
  type: AssessmentType;
  context: AssessmentContext;
  pillar_relevance?: string[]; // Which pillars this question affects
  options?: string[];
  min_value?: number;
  max_value?: number;
  weight: number;
  required: boolean;
  conditional_logic?: {
    show_if: string; // Question key
    values: any[]; // Show if previous question has these values
  };
}

export interface AssessmentTemplate {
  id: string;
  name: string;
  description: string;
  context: AssessmentContext;
  target_audience: string; // 'universal', 'influencer', 'healthcare', etc.
  questions: UniversalQuestion[];
  ai_analysis_prompt: string;
  scoring_algorithm: 'weighted_average' | 'custom' | 'pillar_based';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssessmentResponse {
  id: string;
  client_id: string;
  template_id: string;
  answers: Record<string, any>;
  calculated_scores: {
    overall: number;
    pillar_scores: Record<string, number>;
  };
  ai_analysis: string;
  insights: {
    strengths: string[];
    improvement_areas: string[];
    recommended_actions: string[];
    pillar_priorities: string[];
  };
  metadata: {
    completion_time_seconds: number;
    context: AssessmentContext;
    triggered_by: 'user' | 'system' | 'coach';
  };
  created_at: string;
}

export interface UserProfile {
  id: string;
  client_id: string;
  primary_role: string;
  life_situation: string;
  current_challenges: string[];
  primary_goals: string[];
  personality_traits: Record<string, any>;
  coaching_preferences: {
    communication_style: 'direct' | 'supportive' | 'analytical';
    motivation_type: 'achievement' | 'growth' | 'security';
    interaction_frequency: 'high' | 'medium' | 'low';
  };
  pillar_relevance: Record<string, number>; // How relevant each pillar is (0-1)
  neuroplasticity_profile: {
    habit_formation_speed: 'fast' | 'medium' | 'slow';
    change_resistance: 'low' | 'medium' | 'high';
    preferred_learning_style: 'visual' | 'auditory' | 'kinesthetic';
  };
  created_at: string;
  updated_at: string;
}