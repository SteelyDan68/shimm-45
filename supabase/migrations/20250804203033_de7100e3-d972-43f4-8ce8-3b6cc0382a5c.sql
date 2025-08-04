-- Skapa återstående Stefan AI tabeller utan policies först

-- Stefan Analytics tabellen
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

-- AI Service Logs tabellen
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

-- Neuroplasticity Progress tabellen
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

-- Lägg till user_id till stefan_memory om den saknas
ALTER TABLE public.stefan_memory ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.stefan_memory ADD COLUMN IF NOT EXISTS memory_type TEXT DEFAULT 'conversation';
ALTER TABLE public.stefan_memory ADD COLUMN IF NOT EXISTS importance_score NUMERIC DEFAULT 0.5;
ALTER TABLE public.stefan_memory ADD COLUMN IF NOT EXISTS confidence_score NUMERIC DEFAULT 0.7;
ALTER TABLE public.stefan_memory ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.stefan_memory ADD COLUMN IF NOT EXISTS conversation_id TEXT;
ALTER TABLE public.stefan_memory ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Lägg till indexes
CREATE INDEX IF NOT EXISTS idx_stefan_analytics_user_id ON public.stefan_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_stefan_analytics_type ON public.stefan_analytics(metric_type);
CREATE INDEX IF NOT EXISTS idx_stefan_memory_user_id ON public.stefan_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_stefan_memory_type ON public.stefan_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_neuroplasticity_user_id ON public.neuroplasticity_progress(user_id);

-- Aktivera RLS
ALTER TABLE public.stefan_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_service_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neuroplasticity_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stefan_memory ENABLE ROW LEVEL SECURITY;