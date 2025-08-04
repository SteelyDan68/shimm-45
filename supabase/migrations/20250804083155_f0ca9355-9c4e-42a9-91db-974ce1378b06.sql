-- Skapa tabell för AI-användningsloggar
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  model_used TEXT NOT NULL,
  interaction_type TEXT NOT NULL,
  fallback_used BOOLEAN DEFAULT FALSE,
  response_time_ms INTEGER,
  confidence_score DECIMAL(3,2),
  context_used JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Aktivera RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS-policyer för AI-användningsloggar
CREATE POLICY "Admins can view all AI usage logs"
  ON public.ai_usage_logs FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "System can insert AI usage logs"
  ON public.ai_usage_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own AI usage logs"
  ON public.ai_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Skapa tabell för Stefan AI-konfiguration
CREATE TABLE IF NOT EXISTS public.stefan_ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_model TEXT DEFAULT 'auto' CHECK (primary_model IN ('auto', 'openai', 'gemini')),
  enable_assessment_context BOOLEAN DEFAULT TRUE,
  enable_recommendations BOOLEAN DEFAULT TRUE,
  confidence_threshold DECIMAL(3,2) DEFAULT 0.7 CHECK (confidence_threshold >= 0.0 AND confidence_threshold <= 1.0),
  fallback_enabled BOOLEAN DEFAULT TRUE,
  max_tokens INTEGER DEFAULT 800,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Aktivera RLS för config
ALTER TABLE public.stefan_ai_config ENABLE ROW LEVEL SECURITY;

-- RLS-policyer för Stefan config
CREATE POLICY "Admins can manage Stefan AI config"
  ON public.stefan_ai_config FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Superadmin god mode - stefan_ai_config"
  ON public.stefan_ai_config FOR ALL
  USING (superadmin_god_mode(auth.uid()))
  WITH CHECK (superadmin_god_mode(auth.uid()));

-- Sätt in default-konfiguration
INSERT INTO public.stefan_ai_config (primary_model, enable_assessment_context, enable_recommendations)
VALUES ('auto', TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- Skapa tabell för assessment-integration status
CREATE TABLE IF NOT EXISTS public.assessment_integration_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_users INTEGER DEFAULT 0,
  users_with_assessments INTEGER DEFAULT 0,
  average_context_score DECIMAL(4,2) DEFAULT 0.0,
  last_sync_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Aktivera RLS
ALTER TABLE public.assessment_integration_metrics ENABLE ROW LEVEL SECURITY;

-- RLS-policyer för metrics
CREATE POLICY "Admins can view assessment integration metrics"
  ON public.assessment_integration_metrics FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "System can manage assessment integration metrics"
  ON public.assessment_integration_metrics FOR ALL
  WITH CHECK (true);

-- Lägg till index för prestanda
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON public.ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_model_used ON public.ai_usage_logs(model_used);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at);

-- Skapa trigger för automatisk updated_at
CREATE OR REPLACE FUNCTION public.update_stefan_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stefan_ai_config_updated_at
  BEFORE UPDATE ON public.stefan_ai_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stefan_config_updated_at();

-- Kommentera tabellerna för dokumentation
COMMENT ON TABLE public.ai_usage_logs IS 'Loggar för Stefan AI-användning med modell-val och prestanda';
COMMENT ON TABLE public.stefan_ai_config IS 'Konfiguration för Stefan AI-systemet';
COMMENT ON TABLE public.assessment_integration_metrics IS 'Metrics för assessment-integration i Stefan AI';