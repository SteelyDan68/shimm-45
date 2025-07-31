-- STEP 8: Force drop client_id columns with CASCADE to remove dependent policies

-- Use CASCADE to force drop columns and their dependent policies
ALTER TABLE path_entries DROP COLUMN client_id CASCADE;
ALTER TABLE tasks DROP COLUMN client_id CASCADE;
ALTER TABLE assessment_form_assignments DROP COLUMN client_id CASCADE;
ALTER TABLE assessment_rounds DROP COLUMN client_id CASCADE;
ALTER TABLE pillar_assessments DROP COLUMN client_id CASCADE;
ALTER TABLE calendar_events DROP COLUMN client_id CASCADE;
ALTER TABLE client_data_containers DROP COLUMN client_id CASCADE;
ALTER TABLE client_data_cache DROP COLUMN client_id CASCADE;
ALTER TABLE pillar_visualization_data DROP COLUMN client_id CASCADE;