-- STEP 6 (fixed): Force drop old policies and then drop client_id columns

-- Force drop all old policies that still reference client_id
DROP POLICY IF EXISTS "Users can view path entries for their clients" ON path_entries;
DROP POLICY IF EXISTS "Users can update path entries for their clients" ON path_entries;  
DROP POLICY IF EXISTS "Users can delete path entries for their clients" ON path_entries;
DROP POLICY IF EXISTS "Clients can view their own path entries by email" ON path_entries;
DROP POLICY IF EXISTS "Users can create path entries for their own client profile" ON path_entries;

DROP POLICY IF EXISTS "Users can view tasks for their clients" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks for their clients" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks for their clients" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks for their clients" ON tasks;
DROP POLICY IF EXISTS "Clients can view their own tasks by email" ON tasks;
DROP POLICY IF EXISTS "Clients can update their own tasks by email" ON tasks;

-- Now drop the client_id columns
ALTER TABLE path_entries DROP COLUMN client_id;
ALTER TABLE tasks DROP COLUMN client_id;
ALTER TABLE assessment_form_assignments DROP COLUMN client_id;
ALTER TABLE assessment_rounds DROP COLUMN client_id;
ALTER TABLE pillar_assessments DROP COLUMN client_id;
ALTER TABLE calendar_events DROP COLUMN client_id;
ALTER TABLE client_data_containers DROP COLUMN client_id;
ALTER TABLE client_data_cache DROP COLUMN client_id;
ALTER TABLE pillar_visualization_data DROP COLUMN client_id;