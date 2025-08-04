-- ============================================
-- STEFAN AI COMPREHENSIVE DATABASE STRUCTURE
-- Stöder alla tre faser: Basic Chat, Context Engine, Pedagogical AI
-- ============================================

-- Stefan Memory System (Fas 1)
CREATE TABLE IF NOT EXISTS public.stefan_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id TEXT,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('conversation', 'preference', 'context', 'learning_pattern')),
  content TEXT NOT NULL,
  importance_score NUMERIC DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),
  confidence_score NUMERIC DEFAULT 0.7 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  embedding VECTOR(1536), -- OpenAI embeddings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Context Events (Fas 2)
CREATE TABLE IF NOT EXISTS public.user_context_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id TEXT,
  event_type TEXT NOT NULL,
  context_data JSONB NOT NULL DEFAULT '{}',
  page_url TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Behavior Patterns (Fas 2 & 3)
CREATE TABLE IF NOT EXISTS public.user_behavior_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('navigation', 'learning_style', 'emotional_state', 'journey_prediction', 'engagement')),
  pattern_data JSONB NOT NULL,
  confidence_score NUMERIC DEFAULT 0.7 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  pattern_strength NUMERIC DEFAULT 0.5 CHECK (pattern_strength >= 0 AND pattern_strength <= 1),
  first_detected TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_confirmed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmation_count INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proactive Interventions (Fas 2 & 3)
CREATE TABLE IF NOT EXISTS public.proactive_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  intervention_type TEXT NOT NULL CHECK (intervention_type IN ('motivational', 'educational', 'emotional_check_in', 'learning_optimization', 'break_suggestion')),
  trigger_condition TEXT NOT NULL,
  content TEXT NOT NULL,
  context_snapshot JSONB DEFAULT '{}',
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  delivered_at TIMESTAMP WITH TIME ZONE,
  user_response TEXT,
  effectiveness_score NUMERIC CHECK (effectiveness_score >= 0 AND effectiveness_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stefan Configuration (Admin Management)
CREATE TABLE IF NOT EXISTS public.stefan_ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  config_type TEXT NOT NULL CHECK (config_type IN ('chat_personality', 'learning_parameters', 'emotional_thresholds', 'intervention_settings')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stefan Analytics (Performance Tracking)
CREATE TABLE IF NOT EXISTS public.stefan_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('chat_interaction', 'learning_progress', 'emotional_support', 'intervention_success', 'user_satisfaction')),
  metric_value NUMERIC NOT NULL,
  metric_data JSONB DEFAULT '{}',
  session_id TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Service Logs (System Monitoring)
CREATE TABLE IF NOT EXISTS public.ai_service_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL CHECK (service_type IN ('openai', 'gemini', 'fallback')),
  function_name TEXT NOT NULL,
  user_id UUID,
  request_data JSONB,
  response_data JSONB,
  response_time_ms INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Neuroplasticity Progress (Fas 3)
CREATE TABLE IF NOT EXISTS public.neuroplasticity_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  growth_mindset_score NUMERIC CHECK (growth_mindset_score >= 0 AND growth_mindset_score <= 1),
  resilience_level NUMERIC CHECK (resilience_level >= 0 AND resilience_level <= 1),
  adaptability_score NUMERIC CHECK (adaptability_score >= 0 AND adaptability_score <= 1),
  learning_velocity NUMERIC,
  neural_pathway_strength JSONB DEFAULT '{}',
  cognitive_load_tolerance TEXT CHECK (cognitive_load_tolerance IN ('low', 'medium', 'high')),
  progress_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes för Performance
CREATE INDEX IF NOT EXISTS idx_stefan_memory_user_id ON public.stefan_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_stefan_memory_type ON public.stefan_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_stefan_memory_active ON public.stefan_memory(is_active);
CREATE INDEX IF NOT EXISTS idx_stefan_memory_created_at ON public.stefan_memory(created_at);

CREATE INDEX IF NOT EXISTS idx_context_events_user_id ON public.user_context_events(user_id);
CREATE INDEX IF NOT EXISTS idx_context_events_timestamp ON public.user_context_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_context_events_type ON public.user_context_events(event_type);

CREATE INDEX IF NOT EXISTS idx_behavior_patterns_user_id ON public.user_behavior_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_patterns_type ON public.user_behavior_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_behavior_patterns_active ON public.user_behavior_patterns(is_active);

CREATE INDEX IF NOT EXISTS idx_proactive_interventions_user_id ON public.proactive_interventions(user_id);
CREATE INDEX IF NOT EXISTS idx_proactive_interventions_scheduled ON public.proactive_interventions(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_proactive_interventions_type ON public.proactive_interventions(intervention_type);

CREATE INDEX IF NOT EXISTS idx_stefan_analytics_user_id ON public.stefan_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_stefan_analytics_type ON public.stefan_analytics(metric_type);
CREATE INDEX IF NOT EXISTS idx_stefan_analytics_recorded_at ON public.stefan_analytics(recorded_at);

CREATE INDEX IF NOT EXISTS idx_neuroplasticity_user_id ON public.neuroplasticity_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_neuroplasticity_date ON public.neuroplasticity_progress(assessment_date);

-- RLS Policies
ALTER TABLE public.stefan_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_context_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proactive_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stefan_ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stefan_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_service_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neuroplasticity_progress ENABLE ROW LEVEL SECURITY;

-- Stefan Memory Policies
CREATE POLICY "Users can access their own Stefan memory" 
ON public.stefan_memory FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage Stefan memory" 
ON public.stefan_memory FOR ALL 
WITH CHECK (true);

-- Context Events Policies
CREATE POLICY "Users can view their own context events" 
ON public.user_context_events FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert context events" 
ON public.user_context_events FOR INSERT 
WITH CHECK (true);

-- Behavior Patterns Policies
CREATE POLICY "Users can view their own behavior patterns" 
ON public.user_behavior_patterns FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage behavior patterns" 
ON public.user_behavior_patterns FOR ALL 
WITH CHECK (true);

-- Proactive Interventions Policies
CREATE POLICY "Users can view their own interventions" 
ON public.proactive_interventions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can respond to interventions" 
ON public.proactive_interventions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage interventions" 
ON public.proactive_interventions FOR ALL 
WITH CHECK (true);

-- Stefan Config Policies (Admin only)
CREATE POLICY "Admins can manage Stefan config" 
ON public.stefan_ai_config FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Everyone can read active configs" 
ON public.stefan_ai_config FOR SELECT 
USING (is_active = true);

-- Analytics Policies
CREATE POLICY "Users can view their own analytics" 
ON public.stefan_analytics FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can insert analytics" 
ON public.stefan_analytics FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all analytics" 
ON public.stefan_analytics FOR SELECT 
USING (is_admin(auth.uid()));

-- AI Service Logs Policies
CREATE POLICY "System can manage AI service logs" 
ON public.ai_service_logs FOR ALL 
WITH CHECK (true);

CREATE POLICY "Admins can view AI service logs" 
ON public.ai_service_logs FOR SELECT 
USING (is_admin(auth.uid()));

-- Neuroplasticity Progress Policies
CREATE POLICY "Users can view their own neuroplasticity progress" 
ON public.neuroplasticity_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own neuroplasticity progress" 
ON public.neuroplasticity_progress FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage neuroplasticity progress" 
ON public.neuroplasticity_progress FOR ALL 
WITH CHECK (true);

-- Triggers för updated_at
CREATE OR REPLACE FUNCTION public.update_stefan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stefan_memory_updated_at
  BEFORE UPDATE ON public.stefan_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_stefan_updated_at();

CREATE TRIGGER update_behavior_patterns_updated_at
  BEFORE UPDATE ON public.user_behavior_patterns
  FOR EACH ROW EXECUTE FUNCTION public.update_stefan_updated_at();

CREATE TRIGGER update_proactive_interventions_updated_at
  BEFORE UPDATE ON public.proactive_interventions
  FOR EACH ROW EXECUTE FUNCTION public.update_stefan_updated_at();

CREATE TRIGGER update_stefan_config_updated_at
  BEFORE UPDATE ON public.stefan_ai_config
  FOR EACH ROW EXECUTE FUNCTION public.update_stefan_updated_at();

CREATE TRIGGER update_neuroplasticity_updated_at
  BEFORE UPDATE ON public.neuroplasticity_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_stefan_updated_at();

-- Initial Configuration Data
INSERT INTO public.stefan_ai_config (config_key, config_value, config_type, description) VALUES
('chat_personality', '{"tone": "encouraging", "expertise_level": "expert", "empathy_level": "high", "proactivity": "medium"}', 'chat_personality', 'Stefan AI grundpersonlighet och kommunikationsstil'),
('learning_thresholds', '{"confidence_threshold": 0.7, "pattern_strength_min": 0.6, "intervention_cooldown_hours": 2}', 'learning_parameters', 'Tröskelvärden för lärande och anpassning'),
('emotional_sensitivity', '{"stress_threshold": 0.8, "confidence_threshold": 0.4, "energy_threshold": 0.3}', 'emotional_thresholds', 'Känslomässiga tröskelvärden för interventioner'),
('intervention_settings', '{"max_daily_interventions": 3, "optimal_timing_windows": ["09:00-11:00", "14:00-16:00"], "effectiveness_tracking": true}', 'intervention_settings', 'Inställningar för proaktiva interventioner')
ON CONFLICT (config_key) DO NOTHING;