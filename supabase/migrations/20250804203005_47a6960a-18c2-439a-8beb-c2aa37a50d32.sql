-- Skapa återstående Stefan AI tabeller

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

-- Aktivera RLS på alla tabeller
ALTER TABLE public.stefan_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_service_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neuroplasticity_progress ENABLE ROW LEVEL SECURITY;

-- Lägg till indexes
CREATE INDEX IF NOT EXISTS idx_stefan_analytics_user_id ON public.stefan_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_stefan_analytics_type ON public.stefan_analytics(metric_type);
CREATE INDEX IF NOT EXISTS idx_stefan_analytics_recorded_at ON public.stefan_analytics(recorded_at);

CREATE INDEX IF NOT EXISTS idx_neuroplasticity_user_id ON public.neuroplasticity_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_neuroplasticity_date ON public.neuroplasticity_progress(assessment_date);

-- Skapa RLS Policies för Stefan AI Config
CREATE POLICY "stefan_config_admin_management" 
ON public.stefan_ai_config FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "stefan_config_public_read" 
ON public.stefan_ai_config FOR SELECT 
USING (is_active = true);

-- RLS Policies för Stefan Analytics
CREATE POLICY "stefan_analytics_user_access" 
ON public.stefan_analytics FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "stefan_analytics_system_insert" 
ON public.stefan_analytics FOR INSERT 
WITH CHECK (true);

CREATE POLICY "stefan_analytics_admin_access" 
ON public.stefan_analytics FOR SELECT 
USING (is_admin(auth.uid()));

-- RLS Policies för AI Service Logs
CREATE POLICY "ai_logs_system_management" 
ON public.ai_service_logs FOR ALL 
WITH CHECK (true);

CREATE POLICY "ai_logs_admin_access" 
ON public.ai_service_logs FOR SELECT 
USING (is_admin(auth.uid()));

-- RLS Policies för Neuroplasticity Progress
CREATE POLICY "neuroplasticity_user_access" 
ON public.neuroplasticity_progress FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "neuroplasticity_system_management" 
ON public.neuroplasticity_progress FOR ALL 
WITH CHECK (true);

-- RLS Policies för Proactive Interventions 
CREATE POLICY "interventions_user_read" 
ON public.proactive_interventions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "interventions_user_update" 
ON public.proactive_interventions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "interventions_system_management" 
ON public.proactive_interventions FOR ALL 
WITH CHECK (true);

-- Uppdatera stefan_memory med user_id om den saknar det
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stefan_memory' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.stefan_memory ADD COLUMN user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
    ALTER TABLE public.stefan_memory ADD COLUMN memory_type TEXT NOT NULL DEFAULT 'conversation';
    ALTER TABLE public.stefan_memory ADD COLUMN importance_score NUMERIC DEFAULT 0.5;
    ALTER TABLE public.stefan_memory ADD COLUMN confidence_score NUMERIC DEFAULT 0.7;
    ALTER TABLE public.stefan_memory ADD COLUMN is_active BOOLEAN DEFAULT true;
    
    -- Lägg till index
    CREATE INDEX idx_stefan_memory_user_id ON public.stefan_memory(user_id);
    CREATE INDEX idx_stefan_memory_type ON public.stefan_memory(memory_type);
    CREATE INDEX idx_stefan_memory_active ON public.stefan_memory(is_active);
    
    -- Aktivera RLS
    ALTER TABLE public.stefan_memory ENABLE ROW LEVEL SECURITY;
    
    -- Lägg till policies
    CREATE POLICY "stefan_memory_user_access" 
    ON public.stefan_memory FOR ALL 
    USING (auth.uid() = user_id);
    
    CREATE POLICY "stefan_memory_system_management" 
    ON public.stefan_memory FOR ALL 
    WITH CHECK (true);
  END IF;
END $$;