-- STEP 2: Make user_id NOT NULL and remove client_id dependencies
-- Now that all user_id fields are populated, make them required and drop client_id

-- Make user_id NOT NULL in key tables (where it should always exist)
ALTER TABLE path_entries ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE assessment_form_assignments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE assessment_rounds ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE pillar_assessments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE calendar_events ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE client_data_containers ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE client_data_cache ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE pillar_visualization_data ALTER COLUMN user_id SET NOT NULL;

-- Drop the client_id columns since we now use user_id directly
ALTER TABLE path_entries DROP COLUMN client_id;
ALTER TABLE tasks DROP COLUMN client_id;
ALTER TABLE assessment_form_assignments DROP COLUMN client_id;
ALTER TABLE assessment_rounds DROP COLUMN client_id;
ALTER TABLE pillar_assessments DROP COLUMN client_id;
ALTER TABLE calendar_events DROP COLUMN client_id;
ALTER TABLE client_data_containers DROP COLUMN client_id;
ALTER TABLE client_data_cache DROP COLUMN client_id;
ALTER TABLE pillar_visualization_data DROP COLUMN client_id;