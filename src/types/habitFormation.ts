export type HabitFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type HabitDifficulty = 'micro' | 'small' | 'medium' | 'large' | 'challenging';
export type HabitStatus = 'active' | 'paused' | 'completed' | 'abandoned';
export type HabitCategory = 'self_care' | 'skills' | 'talent' | 'brand' | 'economy' | 'meta';

export interface NeuroplasticityHabit {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  difficulty: HabitDifficulty;
  status: HabitStatus;
  
  // Neuroplasticity settings
  repetition_goal: number; // Total repetitions needed for neuroplastic change
  current_repetitions: number;
  consistency_threshold: number; // % completion needed to maintain habit
  
  // Progressive difficulty
  initial_commitment: string; // Starting micro-habit
  current_commitment: string; // Current level
  progression_rules: {
    success_threshold: number; // Days of success before increasing
    increase_factor: number; // How much to increase difficulty
    max_difficulty: string; // Maximum commitment level
  };
  
  // Timing and context
  preferred_time_of_day?: string;
  context_cues: string[]; // Environmental/situational triggers
  reward_mechanism: string;
  
  // Tracking
  completion_history: HabitCompletion[];
  streak_current: number;
  streak_longest: number;
  success_rate: number; // Rolling 30-day success rate
  
  // AI adaptation
  ai_adjustments: HabitAdjustment[];
  personalization_data: Record<string, any>;
  
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_at: string;
  completion_quality: number; // 1-10 self-rating
  context_notes?: string;
  mood_before: number;
  mood_after: number;
  difficulty_felt: number; // 1-10 how hard it felt
  environmental_factors: string[];
  created_at: string;
}

export interface HabitAdjustment {
  id: string;
  habit_id: string;
  adjustment_type: 'difficulty_increase' | 'difficulty_decrease' | 'frequency_change' | 'timing_change' | 'context_change';
  previous_value: string;
  new_value: string;
  reason: string;
  ai_confidence: number; // 0-1 confidence in this adjustment
  user_feedback?: 'accepted' | 'rejected' | 'modified';
  effectiveness_score?: number; // Measured after implementation
  created_at: string;
}

export interface HabitPattern {
  client_id: string;
  pattern_type: 'success_time' | 'failure_context' | 'mood_correlation' | 'difficulty_preference';
  pattern_data: Record<string, any>;
  confidence_score: number;
  sample_size: number;
  last_updated: string;
}

export interface SetbackEvent {
  id: string;
  client_id: string;
  habit_id?: string;
  setback_type: 'missed_days' | 'low_motivation' | 'external_disruption' | 'difficulty_spike' | 'life_change';
  severity: 'minor' | 'moderate' | 'major';
  detected_at: string;
  context: Record<string, any>;
  recovery_plan?: RecoveryPlan;
  resolved_at?: string;
  resolution_effectiveness?: number;
}

export interface RecoveryPlan {
  id: string;
  setback_event_id: string;
  plan_type: 'gentle_restart' | 'difficulty_reduction' | 'frequency_adjustment' | 'motivation_boost' | 'context_change';
  action_steps: RecoveryAction[];
  estimated_duration: number; // Days to recovery
  ai_generated: boolean;
  user_customized: boolean;
  success_metrics: string[];
  created_at: string;
}

export interface RecoveryAction {
  id: string;
  title: string;
  description: string;
  action_type: 'habit_adjustment' | 'coaching_message' | 'motivation_content' | 'schedule_change' | 'social_support';
  priority: number; // 1-5
  estimated_time: number; // Minutes
  completion_criteria: string;
  completed: boolean;
  completed_at?: string;
}

export interface HabitAnalytics {
  client_id: string;
  total_habits: number;
  active_habits: number;
  average_success_rate: number;
  neuroplastic_progress: number; // 0-100% toward habit formation
  
  // Patterns
  best_performance_time: string;
  most_successful_category: HabitCategory;
  optimal_difficulty_level: HabitDifficulty;
  consistency_score: number; // Overall habit consistency
  
  // Predictions
  habit_formation_eta: number; // Days until automatic behavior
  risk_factors: string[];
  recommended_adjustments: string[];
  
  calculated_at: string;
}

export interface ContextualReminder {
  id: string;
  client_id: string;
  habit_id: string;
  reminder_type: 'time_based' | 'location_based' | 'mood_based' | 'activity_based' | 'social_based';
  trigger_condition: Record<string, any>;
  message_template: string;
  effectiveness_score: number;
  last_triggered: string;
  success_rate: number; // How often it leads to habit completion
  created_at: string;
}