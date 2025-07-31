export interface UserProgress {
  id: string;
  client_id: string;
  current_xp: number;
  current_level: number;
  xp_to_next_level: number;
  total_sessions_completed: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_activity_date: string;
  weekly_goal_progress: number;
  monthly_goal_progress: number;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: 'progress' | 'streak' | 'pillar' | 'milestone' | 'special';
  requirements: {
    type: 'xp' | 'streak' | 'tasks' | 'assessments' | 'custom';
    value: number;
    pillar?: string;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  };
  xp_reward: number;
  is_active: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  client_id: string;
  achievement_id: string;
  achievement_key: string;
  earned_at: string;
  xp_earned: number;
  celebrated: boolean;
  created_at: string;
}

export interface DailyCheckIn {
  id: string;
  client_id: string;
  date: string; // YYYY-MM-DD format
  mood_score: number; // 1-10
  energy_level: number; // 1-10
  stress_level: number; // 1-10
  motivation_level: number; // 1-10
  pillar_focus: string; // Which pillar they want to focus on today
  daily_intention: string; // What they want to accomplish
  reflection_notes?: string; // Optional reflection
  completed_at: string;
  xp_earned: number;
  streak_maintained: boolean;
  created_at: string;
}

export interface CoachingInteraction {
  id: string;
  client_id: string;
  interaction_type: 'notification' | 'reminder' | 'celebration' | 'check_in_prompt' | 'insight';
  trigger_event: string; // What triggered this interaction
  message_content: string;
  ai_generated: boolean;
  context_data: Record<string, any>;
  user_response?: string;
  interaction_outcome: 'opened' | 'dismissed' | 'engaged' | 'completed';
  sent_at: string;
  responded_at?: string;
  created_at: string;
}

export interface ProgressAnalytics {
  client_id: string;
  period: 'week' | 'month' | 'quarter';
  xp_gained: number;
  level_ups: number;
  achievements_earned: number;
  check_ins_completed: number;
  tasks_completed: number;
  assessments_taken: number;
  streak_best: number;
  pillar_progress: Record<string, number>;
  behavior_patterns: {
    most_active_day: string;
    most_active_time: string;
    preferred_pillar: string;
    completion_rate: number;
  };
}

export interface SmartNotification {
  id: string;
  client_id: string;
  notification_type: 'check_in_reminder' | 'streak_warning' | 'achievement_earned' | 'pillar_focus' | 'custom_coaching';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  scheduled_for: string;
  context: Record<string, any>;
  is_sent: boolean;
  user_action?: 'clicked' | 'dismissed' | 'ignored';
  created_at: string;
  sent_at?: string;
}