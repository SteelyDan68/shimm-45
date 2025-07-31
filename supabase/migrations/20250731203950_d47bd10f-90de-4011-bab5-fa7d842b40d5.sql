-- STEP 7: Handle views that depend on client_id before dropping columns

-- Drop the client_analytics_summary view that depends on client_id
DROP VIEW IF EXISTS client_analytics_summary;

-- Now we can drop the client_id columns
ALTER TABLE path_entries DROP COLUMN IF EXISTS client_id;
ALTER TABLE tasks DROP COLUMN IF EXISTS client_id;
ALTER TABLE assessment_form_assignments DROP COLUMN IF EXISTS client_id;
ALTER TABLE assessment_rounds DROP COLUMN IF EXISTS client_id;
ALTER TABLE pillar_assessments DROP COLUMN IF EXISTS client_id;
ALTER TABLE calendar_events DROP COLUMN IF EXISTS client_id;
ALTER TABLE client_data_containers DROP COLUMN IF EXISTS client_id;
ALTER TABLE client_data_cache DROP COLUMN IF EXISTS client_id;
ALTER TABLE pillar_visualization_data DROP COLUMN IF EXISTS client_id;