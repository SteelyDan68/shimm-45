-- Skapa stefan_ai_config tabellen först
CREATE TABLE public.stefan_ai_config (
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

-- Aktivera RLS
ALTER TABLE public.stefan_ai_config ENABLE ROW LEVEL SECURITY;

-- Initial Configuration Data
INSERT INTO public.stefan_ai_config (config_key, config_value, config_type, description) VALUES
('chat_personality', '{"tone": "encouraging", "expertise_level": "expert", "empathy_level": "high", "proactivity": "medium"}', 'chat_personality', 'Stefan AI grundpersonlighet och kommunikationsstil'),
('learning_thresholds', '{"confidence_threshold": 0.7, "pattern_strength_min": 0.6, "intervention_cooldown_hours": 2}', 'learning_parameters', 'Tröskelvärden för lärande och anpassning'),
('emotional_sensitivity', '{"stress_threshold": 0.8, "confidence_threshold": 0.4, "energy_threshold": 0.3}', 'emotional_thresholds', 'Känslomässiga tröskelvärden för interventioner'),
('intervention_settings', '{"max_daily_interventions": 3, "optimal_timing_windows": ["09:00-11:00", "14:00-16:00"], "effectiveness_tracking": true}', 'intervention_settings', 'Inställningar för proaktiva interventioner');