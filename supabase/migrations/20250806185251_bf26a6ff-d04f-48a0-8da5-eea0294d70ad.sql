-- FAS 2: ASSESSMENT STATE MANAGEMENT
-- Utöka assessment_states för robust versioning och draft-hantering

-- Lägg till versioning kolumner
ALTER TABLE assessment_states 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE assessment_states 
ADD COLUMN IF NOT EXISTS parent_draft_id UUID;

ALTER TABLE assessment_states 
ADD COLUMN IF NOT EXISTS conflict_resolution TEXT CHECK (conflict_resolution IN ('overwrite', 'merge', 'new_version'));

ALTER TABLE assessment_states 
ADD COLUMN IF NOT EXISTS auto_saved_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE assessment_states 
ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}';

-- Index för performance
CREATE INDEX IF NOT EXISTS idx_assessment_states_user_version 
ON assessment_states(user_id, assessment_key, version DESC);

CREATE INDEX IF NOT EXISTS idx_assessment_states_auto_saved 
ON assessment_states(auto_saved_at DESC) WHERE is_draft = true;

-- Skapa calendar_actionables tabell för FAS 3 förberedelse
CREATE TABLE IF NOT EXISTS calendar_actionables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pillar_key TEXT NOT NULL,
  ai_recommendation_id UUID,
  timeline_reference TEXT, -- Reference till user_attributes timeline
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  estimated_duration INTEGER, -- minuter
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  neuroplasticity_day INTEGER, -- dag 1-66 i journey
  completion_status TEXT CHECK (completion_status IN ('pending', 'in_progress', 'completed', 'skipped')) DEFAULT 'pending',
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  user_notes TEXT,
  ai_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE calendar_actionables ENABLE ROW LEVEL SECURITY;

-- RLS policies för calendar_actionables
CREATE POLICY "Users can manage their own actionables" 
ON calendar_actionables 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all actionables" 
ON calendar_actionables 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Index för calendar_actionables
CREATE INDEX idx_calendar_actionables_user_date 
ON calendar_actionables(user_id, scheduled_date);

CREATE INDEX idx_calendar_actionables_pillar_status 
ON calendar_actionables(pillar_key, completion_status);

CREATE INDEX idx_calendar_actionables_neuroplasticity_day 
ON calendar_actionables(neuroplasticity_day) WHERE neuroplasticity_day IS NOT NULL;

-- Trigger för updated_at
CREATE OR REPLACE FUNCTION update_calendar_actionables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calendar_actionables_updated_at
  BEFORE UPDATE ON calendar_actionables
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_actionables_updated_at();

-- Skapa assessment recovery function
CREATE OR REPLACE FUNCTION recover_assessment_draft(
  p_user_id UUID,
  p_assessment_key TEXT
) RETURNS JSONB AS $$
DECLARE
  latest_draft RECORD;
  recovery_data JSONB;
BEGIN
  -- Hitta senaste draft
  SELECT * INTO latest_draft
  FROM assessment_states
  WHERE user_id = p_user_id 
    AND assessment_key = p_assessment_key
    AND is_draft = true
  ORDER BY last_saved_at DESC
  LIMIT 1;

  IF latest_draft IS NULL THEN
    RETURN jsonb_build_object(
      'recovered', false,
      'message', 'No draft found'
    );
  END IF;

  -- Bygg recovery data
  recovery_data := jsonb_build_object(
    'recovered', true,
    'form_data', latest_draft.form_data,
    'metadata', latest_draft.metadata,
    'last_saved_at', latest_draft.last_saved_at,
    'version', latest_draft.version,
    'auto_save_count', latest_draft.auto_save_count
  );

  RETURN recovery_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;