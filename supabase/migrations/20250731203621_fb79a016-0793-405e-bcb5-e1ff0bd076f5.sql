-- STEP 1: Migrate all tables from client_id to user_id structure
-- This is a comprehensive refactoring to use user_id as the single identifier

-- First, let's update all tables that reference client_id to use user_id directly
-- We'll populate user_id fields and then drop client_id columns

-- Update path_entries: add user_id where missing and populate from clients table
UPDATE path_entries 
SET user_id = (SELECT user_id FROM clients WHERE clients.id = path_entries.client_id)
WHERE user_id IS NULL AND client_id IS NOT NULL;

-- Update tasks: add user_id where missing and populate from clients table  
UPDATE tasks
SET user_id = (SELECT user_id FROM clients WHERE clients.id = tasks.client_id)
WHERE user_id IS NULL AND client_id IS NOT NULL;

-- Update assessment_form_assignments: add user_id where missing
UPDATE assessment_form_assignments
SET user_id = (SELECT user_id FROM clients WHERE clients.id = assessment_form_assignments.client_id)
WHERE user_id IS NULL AND client_id IS NOT NULL;

-- Update assessment_rounds: add user_id where missing
UPDATE assessment_rounds
SET user_id = (SELECT user_id FROM clients WHERE clients.id = assessment_rounds.client_id)
WHERE user_id IS NULL AND client_id IS NOT NULL;

-- Update pillar_assessments: add user_id where missing
UPDATE pillar_assessments
SET user_id = (SELECT user_id FROM clients WHERE clients.id = pillar_assessments.client_id)
WHERE user_id IS NULL AND client_id IS NOT NULL;

-- Update calendar_events: add user_id where missing
UPDATE calendar_events
SET user_id = (SELECT user_id FROM clients WHERE clients.id = calendar_events.client_id)
WHERE user_id IS NULL AND client_id IS NOT NULL;

-- Update client_data_containers: add user_id where missing
UPDATE client_data_containers
SET user_id = (SELECT user_id FROM clients WHERE clients.id = client_data_containers.client_id)
WHERE user_id IS NULL AND client_id IS NOT NULL;

-- Update client_data_cache: add user_id where missing
UPDATE client_data_cache
SET user_id = (SELECT user_id FROM clients WHERE clients.id = client_data_cache.client_id)
WHERE user_id IS NULL AND client_id IS NOT NULL;

-- Update pillar_visualization_data: add user_id where missing
UPDATE pillar_visualization_data
SET user_id = (SELECT user_id FROM clients WHERE clients.id = pillar_visualization_data.client_id)
WHERE user_id IS NULL AND client_id IS NOT NULL;