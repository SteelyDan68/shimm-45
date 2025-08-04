-- AKTIVERA STEFAN HALLGRENS COACH-TILLDELNING
-- Korrigerar det kritiska problemet med inaktiva coach-client kopplingar

-- 1. Aktivera den befintliga coach-tilldelningen för Stefan Hallgren
UPDATE coach_client_assignments 
SET 
  is_active = true,
  updated_at = now()
WHERE client_id = '5489d5a1-79c7-49b0-8ce3-578967d18cf6'  -- Stefan Hallgren
AND coach_id = '754d7eeb-d9ce-4ede-95e6-f1c0408dfd3e'     -- Börje Sandhill
AND is_active = false;

-- 2. Skapa user_journey_tracking om den inte finns för Stefan
INSERT INTO user_journey_tracking (
  user_id,
  journey_phase,
  overall_progress,
  last_activity_at,
  created_at,
  updated_at
)
VALUES (
  '5489d5a1-79c7-49b0-8ce3-578967d18cf6',  -- Stefan Hallgren
  'active',
  45,  -- Baserat på hans befintliga data
  now(),
  now(),
  now()
)
ON CONFLICT (user_id) 
DO UPDATE SET
  last_activity_at = now(),
  updated_at = now();

-- 3. Skapa user_pillar_activations tabell för Six Pillars tracking
CREATE TABLE IF NOT EXISTS user_pillar_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pillar_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  progress NUMERIC DEFAULT 0,
  activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  activated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, pillar_key)
);

-- Enable RLS
ALTER TABLE user_pillar_activations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own pillar activations" 
ON user_pillar_activations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own pillar activations" 
ON user_pillar_activations 
FOR ALL 
USING (auth.uid() = user_id OR superadmin_god_mode(auth.uid()));

CREATE POLICY "Coaches can view client pillar activations" 
ON user_pillar_activations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.client_id = user_pillar_activations.user_id 
    AND cca.coach_id = auth.uid() 
    AND cca.is_active = true
  )
);

-- 4. Aktivera self_care pillar för Stefan Hallgren
INSERT INTO user_pillar_activations (
  user_id,
  pillar_key,
  is_active,
  progress,
  activated_by,
  activated_at
)
VALUES (
  '5489d5a1-79c7-49b0-8ce3-578967d18cf6',  -- Stefan Hallgren
  'self_care',
  true,
  25,
  '754d7eeb-d9ce-4ede-95e6-f1c0408dfd3e',  -- Börje Sandhill som coach
  now()
)
ON CONFLICT (user_id, pillar_key) 
DO UPDATE SET
  is_active = true,
  progress = 25,
  updated_at = now();

-- 5. Skapa user_journey_tracking tabell om den inte finns
CREATE TABLE IF NOT EXISTS user_journey_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  journey_phase TEXT NOT NULL DEFAULT 'welcome',
  overall_progress NUMERIC NOT NULL DEFAULT 0,
  current_milestone TEXT,
  completed_milestones JSONB DEFAULT '[]',
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  weekly_goals JSONB DEFAULT '[]',
  blockers JSONB DEFAULT '[]',
  preferences JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS för user_journey_tracking
ALTER TABLE user_journey_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies för user_journey_tracking
CREATE POLICY "Users can view their own journey tracking" 
ON user_journey_tracking 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own journey tracking" 
ON user_journey_tracking 
FOR ALL 
USING (auth.uid() = user_id OR superadmin_god_mode(auth.uid()));

CREATE POLICY "Coaches can view client journey tracking" 
ON user_journey_tracking 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.client_id = user_journey_tracking.user_id 
    AND cca.coach_id = auth.uid() 
    AND cca.is_active = true
  )
);

-- Trigger för auto-update av updated_at
CREATE OR REPLACE FUNCTION update_user_journey_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_journey_tracking_updated_at
  BEFORE UPDATE ON user_journey_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_user_journey_tracking_updated_at();