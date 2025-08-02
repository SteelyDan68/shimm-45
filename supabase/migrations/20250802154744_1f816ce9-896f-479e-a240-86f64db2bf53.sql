-- AI Coaching System Tables med historikhantering och GDPR-integration

-- Coaching sessions med fullständig historik
CREATE TABLE IF NOT EXISTS coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('assessment', 'planning', 'review', 'emergency', 'followup')),
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  context_data JSONB NOT NULL DEFAULT '{}',
  ai_analysis TEXT,
  user_feedback JSONB,
  implementation_rate NUMERIC(3,2) DEFAULT 0.0,
  effectiveness_score NUMERIC(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI rekommendationer med versionering och historik
CREATE TABLE IF NOT EXISTS ai_coaching_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES coaching_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('action', 'reflection', 'learning', 'habit', 'goal', 'intervention')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT NOT NULL,
  estimated_time_minutes INTEGER NOT NULL DEFAULT 0,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  expected_outcome TEXT NOT NULL,
  success_metrics JSONB DEFAULT '[]',
  resources JSONB DEFAULT '[]',
  dependencies JSONB DEFAULT '[]',
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'expired')),
  implementation_date TIMESTAMPTZ,
  completion_rate NUMERIC(3,2) DEFAULT 0.0,
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_notes TEXT,
  ai_adaptation_notes TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  superseded_by UUID REFERENCES ai_coaching_recommendations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Coaching plans med versionering och adaptivitet
CREATE TABLE IF NOT EXISTS coaching_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL DEFAULT 30,
  focus_areas JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_reviewed_at TIMESTAMPTZ,
  effectiveness_score NUMERIC(3,2),
  adaptation_count INTEGER DEFAULT 0,
  completion_rate NUMERIC(3,2) DEFAULT 0.0,
  version INTEGER NOT NULL DEFAULT 1,
  parent_plan_id UUID REFERENCES coaching_plans(id),
  ai_generation_context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Coaching plan milestones
CREATE TABLE IF NOT EXISTS coaching_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES coaching_plans(id) ON DELETE CASCADE,
  milestone_date TIMESTAMPTZ NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  success_criteria JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'achieved', 'missed', 'rescheduled')),
  completion_date TIMESTAMPTZ,
  user_reflection TEXT,
  ai_assessment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Coaching progress tracking (för tidslinje-visualisering)
CREATE TABLE IF NOT EXISTS coaching_progress_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID REFERENCES coaching_sessions(id),
  plan_id UUID REFERENCES coaching_plans(id),
  recommendation_id UUID REFERENCES ai_coaching_recommendations(id),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('session_start', 'session_end', 'recommendation_created', 'recommendation_completed', 'milestone_achieved', 'plan_created', 'plan_updated', 'reflection', 'breakthrough', 'setback')),
  title TEXT NOT NULL,
  description TEXT,
  impact_score NUMERIC(3,2) CHECK (impact_score >= 0 AND impact_score <= 10),
  metadata JSONB DEFAULT '{}',
  visible_to_user BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Coaching analytics för lärande AI
CREATE TABLE IF NOT EXISTS coaching_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC,
  metric_data JSONB,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id UUID REFERENCES coaching_sessions(id),
  recommendation_id UUID REFERENCES ai_coaching_recommendations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Triggers för automatisk uppdatering
CREATE OR REPLACE FUNCTION update_coaching_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_coaching_sessions_updated_at
  BEFORE UPDATE ON coaching_sessions
  FOR EACH ROW EXECUTE FUNCTION update_coaching_updated_at();

CREATE TRIGGER update_ai_coaching_recommendations_updated_at
  BEFORE UPDATE ON ai_coaching_recommendations
  FOR EACH ROW EXECUTE FUNCTION update_coaching_updated_at();

CREATE TRIGGER update_coaching_plans_updated_at
  BEFORE UPDATE ON coaching_plans
  FOR EACH ROW EXECUTE FUNCTION update_coaching_updated_at();

CREATE TRIGGER update_coaching_milestones_updated_at
  BEFORE UPDATE ON coaching_milestones
  FOR EACH ROW EXECUTE FUNCTION update_coaching_updated_at();

-- Trigger för att skapa progress entries automatiskt
CREATE OR REPLACE FUNCTION create_coaching_progress_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Vid session start
  IF TG_TABLE_NAME = 'coaching_sessions' AND TG_OP = 'INSERT' THEN
    INSERT INTO coaching_progress_entries (
      user_id, session_id, entry_type, title, description, metadata
    ) VALUES (
      NEW.user_id, NEW.id, 'session_start', 
      'Coaching session startad', 
      'Session av typ: ' || NEW.session_type,
      jsonb_build_object('session_type', NEW.session_type)
    );
  END IF;

  -- Vid session avslut
  IF TG_TABLE_NAME = 'coaching_sessions' AND TG_OP = 'UPDATE' AND OLD.end_time IS NULL AND NEW.end_time IS NOT NULL THEN
    INSERT INTO coaching_progress_entries (
      user_id, session_id, entry_type, title, description, metadata
    ) VALUES (
      NEW.user_id, NEW.id, 'session_end', 
      'Coaching session avslutad', 
      'Session varade ' || COALESCE(NEW.duration_minutes::text, 'okänt antal') || ' minuter',
      jsonb_build_object('duration_minutes', NEW.duration_minutes, 'effectiveness_score', NEW.effectiveness_score)
    );
  END IF;

  -- Vid rekommendation skapad
  IF TG_TABLE_NAME = 'ai_coaching_recommendations' AND TG_OP = 'INSERT' THEN
    INSERT INTO coaching_progress_entries (
      user_id, session_id, recommendation_id, entry_type, title, description, metadata
    ) VALUES (
      NEW.user_id, NEW.session_id, NEW.id, 'recommendation_created', 
      'Ny rekommendation: ' || NEW.title, 
      NEW.description,
      jsonb_build_object('priority', NEW.priority, 'category', NEW.category, 'difficulty', NEW.difficulty)
    );
  END IF;

  -- Vid rekommendation genomförd
  IF TG_TABLE_NAME = 'ai_coaching_recommendations' AND TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
    INSERT INTO coaching_progress_entries (
      user_id, session_id, recommendation_id, entry_type, title, description, metadata, impact_score
    ) VALUES (
      NEW.user_id, NEW.session_id, NEW.id, 'recommendation_completed', 
      'Rekommendation genomförd: ' || NEW.title, 
      'Användaren har genomfört rekommendationen med ' || COALESCE(NEW.completion_rate::text, '0') || '% genomförande',
      jsonb_build_object('completion_rate', NEW.completion_rate, 'user_rating', NEW.user_rating),
      COALESCE(NEW.user_rating, 3.0)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applicera triggers
CREATE TRIGGER coaching_session_progress_trigger
  AFTER INSERT OR UPDATE ON coaching_sessions
  FOR EACH ROW EXECUTE FUNCTION create_coaching_progress_entry();

CREATE TRIGGER coaching_recommendation_progress_trigger
  AFTER INSERT OR UPDATE ON ai_coaching_recommendations
  FOR EACH ROW EXECUTE FUNCTION create_coaching_progress_entry();

-- RLS Policies
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coaching_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_analytics ENABLE ROW LEVEL SECURITY;

-- Users can manage their own coaching data
CREATE POLICY "Users can manage their own coaching sessions" ON coaching_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own coaching recommendations" ON ai_coaching_recommendations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own coaching plans" ON coaching_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own coaching milestones" ON coaching_milestones
  FOR ALL USING (EXISTS (
    SELECT 1 FROM coaching_plans cp WHERE cp.id = plan_id AND cp.user_id = auth.uid()
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM coaching_plans cp WHERE cp.id = plan_id AND cp.user_id = auth.uid()
  ));

CREATE POLICY "Users can view their own coaching progress" ON coaching_progress_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own coaching analytics" ON coaching_analytics
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admins can manage all coaching data
CREATE POLICY "Admins can manage all coaching sessions" ON coaching_sessions
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all coaching recommendations" ON ai_coaching_recommendations
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all coaching plans" ON coaching_plans
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all coaching milestones" ON coaching_milestones
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can view all coaching progress" ON coaching_progress_entries
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all coaching analytics" ON coaching_analytics
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- System can insert progress entries och analytics
CREATE POLICY "System can insert coaching progress entries" ON coaching_progress_entries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert coaching analytics" ON coaching_analytics
  FOR INSERT WITH CHECK (true);

-- Index för prestanda
CREATE INDEX idx_coaching_sessions_user_id ON coaching_sessions(user_id);
CREATE INDEX idx_coaching_sessions_created_at ON coaching_sessions(created_at);
CREATE INDEX idx_ai_coaching_recommendations_user_id ON ai_coaching_recommendations(user_id);
CREATE INDEX idx_ai_coaching_recommendations_session_id ON ai_coaching_recommendations(session_id);
CREATE INDEX idx_ai_coaching_recommendations_status ON ai_coaching_recommendations(status);
CREATE INDEX idx_coaching_plans_user_id ON coaching_plans(user_id);
CREATE INDEX idx_coaching_progress_entries_user_id ON coaching_progress_entries(user_id);
CREATE INDEX idx_coaching_progress_entries_created_at ON coaching_progress_entries(created_at);
CREATE INDEX idx_coaching_analytics_user_id ON coaching_analytics(user_id);
CREATE INDEX idx_coaching_analytics_recorded_at ON coaching_analytics(recorded_at);