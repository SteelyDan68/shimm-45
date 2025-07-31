-- Fix NULL user_id values in pillar_assessments before making NOT NULL
-- Delete orphaned records that can't be mapped to users
DELETE FROM pillar_assessments WHERE user_id IS NULL AND client_id IS NULL;

-- For records with client_id but no user_id, try to map them
UPDATE pillar_assessments 
SET user_id = (SELECT user_id FROM clients WHERE clients.id = pillar_assessments.client_id)
WHERE user_id IS NULL AND client_id IS NOT NULL;

-- Delete any remaining unmappable records
DELETE FROM pillar_assessments WHERE user_id IS NULL;