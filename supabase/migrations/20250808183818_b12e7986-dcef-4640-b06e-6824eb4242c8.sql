-- AI Processing Tracking Table
CREATE TABLE public.ai_processing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  process_type TEXT NOT NULL CHECK (process_type IN ('assessment_analysis', 'actionable_generation', 'calendar_optimization')),
  pillar_type TEXT,
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'processing', 'completed', 'failed')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  current_step TEXT,
  estimated_completion_time TIMESTAMP WITH TIME ZONE,
  input_data JSONB DEFAULT '{}',
  processing_metadata JSONB DEFAULT '{}',
  error_details TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Assessment Actionable Mappings Table  
CREATE TABLE public.assessment_actionable_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  assessment_round_id UUID REFERENCES assessment_rounds(id) ON DELETE CASCADE,
  actionable_id UUID REFERENCES calendar_actionables(id) ON DELETE CASCADE,
  assessment_question_key TEXT NOT NULL,
  actionable_reasoning TEXT NOT NULL,
  confidence_score NUMERIC(3,2) DEFAULT 0.8 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  pillar_connection TEXT NOT NULL,
  neuroplastic_rationale TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(assessment_round_id, actionable_id, assessment_question_key)
);

-- User Pipeline Progress Table
CREATE TABLE public.user_pipeline_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pillar_type TEXT NOT NULL,
  current_step TEXT NOT NULL CHECK (current_step IN ('assessment', 'ai_processing', 'results_preview', 'actionables_generation', 'calendar_integration', 'completed')),
  step_progress_percentage INTEGER DEFAULT 0 CHECK (step_progress_percentage >= 0 AND step_progress_percentage <= 100),
  total_progress_percentage INTEGER DEFAULT 0 CHECK (total_progress_percentage >= 0 AND total_progress_percentage <= 100),
  step_data JSONB DEFAULT '{}',
  completion_timestamps JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, pillar_type)
);

-- Predictive Analytics Table
CREATE TABLE public.predictive_user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('completion_likelihood', 'optimal_schedule_time', 'success_probability', 'difficulty_adjustment')),
  pillar_type TEXT,
  prediction_value NUMERIC,
  prediction_metadata JSONB DEFAULT '{}',
  confidence_level NUMERIC(3,2) DEFAULT 0.7 CHECK (confidence_level >= 0 AND confidence_level <= 1),
  based_on_patterns JSONB DEFAULT '[]',
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_processing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_actionable_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pipeline_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_user_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own AI processing sessions" ON public.ai_processing_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own assessment mappings" ON public.assessment_actionable_mappings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own pipeline progress" ON public.user_pipeline_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own predictive analytics" ON public.predictive_user_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage predictive analytics" ON public.predictive_user_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update predictive analytics" ON public.predictive_user_analytics
  FOR UPDATE USING (true);

-- Triggers
CREATE OR REPLACE FUNCTION update_ai_processing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_processing_sessions_updated_at
  BEFORE UPDATE ON public.ai_processing_sessions
  FOR EACH ROW EXECUTE FUNCTION update_ai_processing_updated_at();

CREATE TRIGGER assessment_actionable_mappings_updated_at
  BEFORE UPDATE ON public.assessment_actionable_mappings
  FOR EACH ROW EXECUTE FUNCTION update_ai_processing_updated_at();

CREATE TRIGGER user_pipeline_progress_updated_at
  BEFORE UPDATE ON public.user_pipeline_progress
  FOR EACH ROW EXECUTE FUNCTION update_ai_processing_updated_at();

CREATE TRIGGER predictive_user_analytics_updated_at
  BEFORE UPDATE ON public.predictive_user_analytics
  FOR EACH ROW EXECUTE FUNCTION update_ai_processing_updated_at();