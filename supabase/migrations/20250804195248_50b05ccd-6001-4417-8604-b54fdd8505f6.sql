-- Enhanced Context Engine Foundation
-- Utöka befintliga tabeller för djupare context-tracking

-- Skapa user_context_events för detaljerad aktivitetsloggning
CREATE TABLE public.user_context_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'page_visit', 'action', 'interaction', 'achievement', 'struggle'
  context_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  page_url TEXT,
  session_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Utöka stefan_interactions för bättre AI-context
ALTER TABLE public.stefan_interactions 
ADD COLUMN IF NOT EXISTS emotional_state TEXT,
ADD COLUMN IF NOT EXISTS priority_level INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS requires_followup BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS followup_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ai_confidence_score NUMERIC(3,2) DEFAULT 0.8;

-- Skapa context_insights för AI-genererade insikter
CREATE TABLE public.context_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  insight_type TEXT NOT NULL, -- 'behavioral_pattern', 'opportunity', 'risk', 'recommendation'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score NUMERIC(3,2) DEFAULT 0.5,
  data_sources JSONB NOT NULL DEFAULT '[]'::jsonb, -- Vilka data som användes
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  acted_upon BOOLEAN DEFAULT false,
  action_taken TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Skapa proactive_interventions för AI-driven handlingar
CREATE TABLE public.proactive_interventions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trigger_condition TEXT NOT NULL,
  intervention_type TEXT NOT NULL, -- 'message', 'task_suggestion', 'resource_share', 'check_in'
  content TEXT NOT NULL,
  delivery_method TEXT NOT NULL DEFAULT 'messenger', -- 'messenger', 'widget', 'notification'
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  user_response TEXT,
  effectiveness_score INTEGER, -- 1-5 rating
  context_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Skapa user_behavior_patterns för ML-insights
CREATE TABLE public.user_behavior_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pattern_type TEXT NOT NULL, -- 'daily_rhythm', 'engagement_cycle', 'motivation_trend'
  pattern_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  pattern_strength NUMERIC(3,2) DEFAULT 0.5, -- Hur stark pattern är
  first_detected TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_confirmed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  prediction_accuracy NUMERIC(3,2) DEFAULT 0.5,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS på alla nya tabeller
ALTER TABLE public.user_context_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.context_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proactive_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies för user_context_events
CREATE POLICY "Users can view their own context events" 
ON public.user_context_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own context events" 
ON public.user_context_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all context events" 
ON public.user_context_events 
FOR ALL 
USING (is_admin(auth.uid()));

-- RLS Policies för context_insights
CREATE POLICY "Users can view their own insights" 
ON public.context_insights 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create insights" 
ON public.context_insights 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage all insights" 
ON public.context_insights 
FOR ALL 
USING (is_admin(auth.uid()));

-- RLS Policies för proactive_interventions
CREATE POLICY "Users can view their own interventions" 
ON public.proactive_interventions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their intervention responses" 
ON public.proactive_interventions 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can create interventions" 
ON public.proactive_interventions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage all interventions" 
ON public.proactive_interventions 
FOR ALL 
USING (is_admin(auth.uid()));

-- RLS Policies för user_behavior_patterns
CREATE POLICY "Users can view their own patterns" 
ON public.user_behavior_patterns 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage behavior patterns" 
ON public.user_behavior_patterns 
FOR ALL 
WITH CHECK (true);

CREATE POLICY "Admins can view all patterns" 
ON public.user_behavior_patterns 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Indexes för prestanda
CREATE INDEX idx_user_context_events_user_timestamp ON public.user_context_events(user_id, timestamp DESC);
CREATE INDEX idx_user_context_events_type ON public.user_context_events(event_type);
CREATE INDEX idx_context_insights_user_type ON public.context_insights(user_id, insight_type);
CREATE INDEX idx_proactive_interventions_user_scheduled ON public.proactive_interventions(user_id, scheduled_for);
CREATE INDEX idx_user_behavior_patterns_user_active ON public.user_behavior_patterns(user_id, is_active);

-- Trigger för updated_at på proactive_interventions
CREATE TRIGGER update_proactive_interventions_updated_at
  BEFORE UPDATE ON public.proactive_interventions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();