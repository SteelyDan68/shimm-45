-- STEP 6: Now drop the client_id columns - policies have been updated
-- Drop client_id columns from all main tables

ALTER TABLE path_entries DROP COLUMN client_id;
ALTER TABLE tasks DROP COLUMN client_id; 
ALTER TABLE assessment_form_assignments DROP COLUMN client_id;
ALTER TABLE assessment_rounds DROP COLUMN client_id;
ALTER TABLE pillar_assessments DROP COLUMN client_id;
ALTER TABLE calendar_events DROP COLUMN client_id;
ALTER TABLE client_data_containers DROP COLUMN client_id;
ALTER TABLE client_data_cache DROP COLUMN client_id;
ALTER TABLE pillar_visualization_data DROP COLUMN client_id;