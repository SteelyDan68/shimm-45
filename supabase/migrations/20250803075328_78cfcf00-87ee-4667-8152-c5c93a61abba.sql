-- DELMOMENT 1: Assessment State Management + GDPR Journaling
-- Skapa assessment_states tabell för att hantera pågående assessments
CREATE TABLE IF NOT EXISTS public.assessment_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assessment_type TEXT NOT NULL, -- 'welcome', 'pillar', 'open_track'
  assessment_key TEXT, -- för pillar assessments: pillar key
  current_step TEXT NOT NULL,
  form_data JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  is_draft BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  abandoned_at TIMESTAMP WITH TIME ZONE,
  auto_save_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(user_id, assessment_type, assessment_key, is_draft),
  CHECK (assessment_type IN ('welcome', 'pillar', 'open_track'))
);

-- Assessment Events för GDPR-kompatibel journaling
CREATE TABLE IF NOT EXISTS public.assessment_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assessment_state_id UUID,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Referens till assessment_states
  FOREIGN KEY (assessment_state_id) REFERENCES public.assessment_states(id) ON DELETE CASCADE,
  
  -- Event types
  CHECK (event_type IN (
    'assessment_started', 'step_changed', 'auto_saved', 'manually_saved',
    'assessment_completed', 'assessment_abandoned', 'assessment_resumed',
    'validation_failed', 'navigation_blocked', 'data_restored'
  ))
);

-- Coach Insights för AI-rekommendationer
CREATE TABLE IF NOT EXISTS public.coach_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL,
  client_id UUID NOT NULL,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'active',
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  action_points JSONB NOT NULL DEFAULT '[]',
  data_sources JSONB NOT NULL DEFAULT '[]',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  
  CHECK (insight_type IN (
    'assessment_anomaly', 'progress_stagnation', 'new_barriers',
    'improvement_opportunity', 'engagement_drop', 'goal_deviation',
    'emotional_indicator', 'pattern_detected'
  )),
  CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  CHECK (status IN ('active', 'acknowledged', 'resolved', 'expired'))
);

-- Single Source of Truth för User Journey Progress
CREATE TABLE IF NOT EXISTS public.user_journey_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_assessment_state_id UUID,
  journey_phase TEXT NOT NULL DEFAULT 'initial',
  overall_progress NUMERIC NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  wellness_score NUMERIC,
  risk_indicators JSONB NOT NULL DEFAULT '[]',
  intervention_flags JSONB NOT NULL DEFAULT '[]',
  coach_notes TEXT,
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Referens till aktuell assessment state
  FOREIGN KEY (current_assessment_state_id) REFERENCES public.assessment_states(id) ON DELETE SET NULL,
  
  CHECK (journey_phase IN (
    'initial', 'assessment_in_progress', 'analysis_pending', 
    'development_active', 'maintenance', 'review_needed'
  ))
);

-- Autonomous Coach Triggers
CREATE TABLE IF NOT EXISTS public.autonomous_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trigger_type TEXT NOT NULL,
  condition_met_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  trigger_data JSONB NOT NULL DEFAULT '{}',
  action_taken TEXT,
  ai_intervention JSONB,
  resolution_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  CHECK (trigger_type IN (
    'assessment_abandoned', 'progress_stalled', 'negative_sentiment',
    'missing_checkin', 'barrier_detected', 'goal_deviation',
    'engagement_drop', 'crisis_indicator'
  )),
  CHECK (resolution_status IN ('pending', 'intervened', 'resolved', 'escalated'))
);

-- Enable RLS på alla tabeller
ALTER TABLE public.assessment_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_journey_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autonomous_triggers ENABLE ROW LEVEL SECURITY;

-- RLS Policies för assessment_states
CREATE POLICY "Users can manage their own assessment states" 
ON public.assessment_states 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view client assessment states" 
ON public.assessment_states 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.client_id = user_id 
    AND cca.coach_id = auth.uid() 
    AND cca.is_active = true
  )
);

-- RLS Policies för assessment_events
CREATE POLICY "Users can view their own assessment events" 
ON public.assessment_events 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert assessment events" 
ON public.assessment_events 
FOR INSERT WITH CHECK (true);

-- RLS Policies för coach_insights
CREATE POLICY "Coaches can manage insights for their clients" 
ON public.coach_insights 
FOR ALL USING (auth.uid() = coach_id);

CREATE POLICY "Clients can view insights about themselves" 
ON public.coach_insights 
FOR SELECT USING (auth.uid() = client_id);

-- RLS Policies för user_journey_tracking  
CREATE POLICY "Users can view their own journey tracking" 
ON public.user_journey_tracking 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view client journey tracking" 
ON public.user_journey_tracking 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.client_id = user_id 
    AND cca.coach_id = auth.uid() 
    AND cca.is_active = true
  )
);

CREATE POLICY "System can manage journey tracking" 
ON public.user_journey_tracking 
FOR ALL WITH CHECK (true);

-- RLS Policies för autonomous_triggers
CREATE POLICY "Users can view their own triggers" 
ON public.autonomous_triggers 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view client triggers" 
ON public.autonomous_triggers 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.client_id = user_id 
    AND cca.coach_id = auth.uid() 
    AND cca.is_active = true
  )
);

CREATE POLICY "System can manage autonomous triggers" 
ON public.autonomous_triggers 
FOR ALL WITH CHECK (true);

-- Triggers för updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_assessment_states_updated_at 
BEFORE UPDATE ON public.assessment_states 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_insights_updated_at 
BEFORE UPDATE ON public.coach_insights 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_journey_tracking_updated_at 
BEFORE UPDATE ON public.user_journey_tracking 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index för performance
CREATE INDEX idx_assessment_states_user_draft ON public.assessment_states(user_id, is_draft);
CREATE INDEX idx_assessment_events_user_timestamp ON public.assessment_events(user_id, timestamp);
CREATE INDEX idx_coach_insights_coach_status ON public.coach_insights(coach_id, status);
CREATE INDEX idx_user_journey_tracking_progress ON public.user_journey_tracking(user_id, overall_progress);
CREATE INDEX idx_autonomous_triggers_status ON public.autonomous_triggers(user_id, resolution_status);