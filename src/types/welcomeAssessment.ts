export interface WheelOfLifeArea {
  key: string;
  name: string;
  description: string;
  score: number;
}

export interface WelcomeAssessmentData {
  wheelOfLife: Record<string, number>;
  adaptiveQuestions: Record<string, any>;
  freeTextResponses: Record<string, string>;
  quickWins: Record<string, any>;
}

export interface WelcomeAssessmentResult {
  id: string;
  user_id: string;
  wheel_of_life_scores: any;
  adaptive_questions: any;
  free_text_responses: any;
  quick_wins: any;
  overall_score?: number;
  ai_analysis?: string;
  recommendations?: any;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface AdaptiveQuestion {
  key: string;
  text: string;
  type: 'scale' | 'boolean' | 'multiple_choice';
  dependsOn: string; // Which wheel of life area triggered this
  options?: string[];
  min?: number;
  max?: number;
}

export interface StefanPersona {
  id: string;
  name: string;
  role: string;
  description: string;
  trigger_conditions: string[];
  greeting_template: string;
  coaching_style: string;
}

export interface UserJourneyState {
  id: string;
  user_id: string;
  current_phase: string;
  completed_assessments: any;
  next_recommended_assessment?: string;
  journey_progress: number;
  stefan_interventions_count: number;
  last_activity_at: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface StefanInteraction {
  id: string;
  user_id: string;
  interaction_type: string;
  stefan_persona: string;
  context_data: any;
  message_content?: string;
  user_response?: string;
  ai_analysis?: string;
  created_at: string;
}