-- Phase 1: Create compatibility layer with user_id mapping

-- Add user_id columns to tables that have client_id but not user_id
ALTER TABLE assessment_form_assignments ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE assessment_rounds ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE client_data_cache ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE client_data_containers ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE client_pillar_activations ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE client_pillar_assignments ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE path_entries ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE pillar_assessments ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE pillar_visualization_data ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID;

-- Populate user_id columns by joining with clients table
UPDATE assessment_form_assignments 
SET user_id = c.user_id 
FROM clients c 
WHERE assessment_form_assignments.client_id = c.id AND assessment_form_assignments.user_id IS NULL;

UPDATE assessment_rounds 
SET user_id = c.user_id 
FROM clients c 
WHERE assessment_rounds.client_id = c.id AND assessment_rounds.user_id IS NULL;

UPDATE calendar_events 
SET user_id = c.user_id 
FROM clients c 
WHERE calendar_events.client_id = c.id AND calendar_events.user_id IS NULL;

UPDATE client_data_cache 
SET user_id = c.user_id 
FROM clients c 
WHERE client_data_cache.client_id = c.id AND client_data_cache.user_id IS NULL;

UPDATE client_data_containers 
SET user_id = c.user_id 
FROM clients c 
WHERE client_data_containers.client_id = c.id AND client_data_containers.user_id IS NULL;

UPDATE client_pillar_activations 
SET user_id = c.user_id 
FROM clients c 
WHERE client_pillar_activations.client_id = c.id AND client_pillar_activations.user_id IS NULL;

UPDATE client_pillar_assignments 
SET user_id = c.user_id 
FROM clients c 
WHERE client_pillar_assignments.client_id = c.id AND client_pillar_assignments.user_id IS NULL;

UPDATE path_entries 
SET user_id = c.user_id 
FROM clients c 
WHERE path_entries.client_id = c.id AND path_entries.user_id IS NULL;

UPDATE pillar_assessments 
SET user_id = c.user_id 
FROM clients c 
WHERE pillar_assessments.client_id = c.id AND pillar_assessments.user_id IS NULL;

UPDATE pillar_visualization_data 
SET user_id = c.user_id 
FROM clients c 
WHERE pillar_visualization_data.client_id = c.id AND pillar_visualization_data.user_id IS NULL;

UPDATE tasks 
SET user_id = c.user_id 
FROM clients c 
WHERE tasks.client_id = c.id AND tasks.user_id IS NULL;

-- Create compatibility view for client-user mapping
CREATE OR REPLACE VIEW client_user_mapping AS
SELECT 
  c.id AS client_id,
  c.user_id,
  p.email,
  p.first_name,
  p.last_name,
  COALESCE(p.first_name || ' ' || p.last_name, p.email, c.name) AS display_name
FROM clients c
LEFT JOIN profiles p ON c.user_id = p.id;

-- Create helper function to get user_id from client_id
CREATE OR REPLACE FUNCTION get_user_id_from_client_id(client_uuid UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT user_id FROM clients WHERE id = client_uuid;
$$;

-- Create helper function to get client_id from user_id  
CREATE OR REPLACE FUNCTION get_client_id_from_user_id(user_uuid UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM clients WHERE user_id = user_uuid LIMIT 1;
$$;

-- Add indexes for performance on new user_id columns
CREATE INDEX IF NOT EXISTS idx_assessment_form_assignments_user_id ON assessment_form_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_rounds_user_id ON assessment_rounds(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_client_data_cache_user_id ON client_data_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_client_data_containers_user_id ON client_data_containers(user_id);
CREATE INDEX IF NOT EXISTS idx_client_pillar_activations_user_id ON client_pillar_activations(user_id);
CREATE INDEX IF NOT EXISTS idx_client_pillar_assignments_user_id ON client_pillar_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_path_entries_user_id ON path_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_pillar_assessments_user_id ON pillar_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_pillar_visualization_data_user_id ON pillar_visualization_data(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);