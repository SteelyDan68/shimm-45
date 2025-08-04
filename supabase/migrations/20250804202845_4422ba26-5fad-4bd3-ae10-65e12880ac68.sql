-- ============================================
-- STEFAN AI INCREMENTAL DATABASE UPDATES
-- Lägger till endast saknade komponenter
-- ============================================

-- Uppdatera stefan_memory tabellen med user_id och andra saknade kolumner
ALTER TABLE public.stefan_memory 
ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

ALTER TABLE public.stefan_memory 
ADD COLUMN IF NOT EXISTS conversation_id TEXT;

ALTER TABLE public.stefan_memory 
ADD COLUMN IF NOT EXISTS memory_type TEXT NOT NULL DEFAULT 'conversation' CHECK (memory_type IN ('conversation', 'preference', 'context', 'learning_pattern'));

ALTER TABLE public.stefan_memory 
ADD COLUMN IF NOT EXISTS importance_score NUMERIC DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1);

ALTER TABLE public.stefan_memory 
ADD COLUMN IF NOT EXISTS confidence_score NUMERIC DEFAULT 0.7 CHECK (confidence_score >= 0 AND confidence_score <= 1);

ALTER TABLE public.stefan_memory 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

ALTER TABLE public.stefan_memory 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.stefan_memory 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Lägg till saknade kolumner i user_behavior_patterns om de inte finns
ALTER TABLE public.user_behavior_patterns 
ADD COLUMN IF NOT EXISTS confidence_score NUMERIC DEFAULT 0.7 CHECK (confidence_score >= 0 AND confidence_score <= 1);

ALTER TABLE public.user_behavior_patterns 
ADD COLUMN IF NOT EXISTS confirmation_count INTEGER DEFAULT 1;

ALTER TABLE public.user_behavior_patterns 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.user_behavior_patterns 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Skapa proactive_interventions tabellen
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

-- Skapa stefan_ai_config tabellen
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

-- Skapa stefan_analytics tabellen
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

-- Skapa ai_service_logs tabellen
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

-- Skapa neuroplasticity_progress tabellen
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

-- Lägg till indexes
CREATE INDEX IF NOT EXISTS idx_stefan_memory_user_id ON public.stefan_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_stefan_memory_type ON public.stefan_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_stefan_memory_active ON public.stefan_memory(is_active);

CREATE INDEX IF NOT EXISTS idx_proactive_interventions_user_id ON public.proactive_interventions(user_id);
CREATE INDEX IF NOT EXISTS idx_proactive_interventions_scheduled ON public.proactive_interventions(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_proactive_interventions_type ON public.proactive_interventions(intervention_type);

CREATE INDEX IF NOT EXISTS idx_stefan_analytics_user_id ON public.stefan_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_stefan_analytics_type ON public.stefan_analytics(metric_type);
CREATE INDEX IF NOT EXISTS idx_stefan_analytics_recorded_at ON public.stefan_analytics(recorded_at);

CREATE INDEX IF NOT EXISTS idx_neuroplasticity_user_id ON public.neuroplasticity_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_neuroplasticity_date ON public.neuroplasticity_progress(assessment_date);

-- Aktivera RLS endast på nya tabeller
ALTER TABLE public.proactive_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stefan_ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stefan_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_service_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neuroplasticity_progress ENABLE ROW LEVEL SECURITY;

-- Initial Configuration Data
INSERT INTO public.stefan_ai_config (config_key, config_value, config_type, description) VALUES
('chat_personality', '{"tone": "encouraging", "expertise_level": "expert", "empathy_level": "high", "proactivity": "medium"}', 'chat_personality', 'Stefan AI grundpersonlighet och kommunikationsstil'),
('learning_thresholds', '{"confidence_threshold": 0.7, "pattern_strength_min": 0.6, "intervention_cooldown_hours": 2}', 'learning_parameters', 'Tröskelvärden för lärande och anpassning'),
('emotional_sensitivity', '{"stress_threshold": 0.8, "confidence_threshold": 0.4, "energy_threshold": 0.3}', 'emotional_thresholds', 'Känslomässiga tröskelvärden för interventioner'),
('intervention_settings', '{"max_daily_interventions": 3, "optimal_timing_windows": ["09:00-11:00", "14:00-16:00"], "effectiveness_tracking": true}', 'intervention_settings', 'Inställningar för proaktiva interventioner')
ON CONFLICT (config_key) DO NOTHING;