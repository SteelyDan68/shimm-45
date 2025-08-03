-- Fix pillar_key check constraint to allow open_track
ALTER TABLE pillar_assessments DROP CONSTRAINT IF EXISTS pillar_assessments_pillar_key_check;

-- Add updated constraint that includes open_track
ALTER TABLE pillar_assessments ADD CONSTRAINT pillar_assessments_pillar_key_check 
CHECK (pillar_key IN ('self_care', 'skills', 'talent', 'brand', 'economy', 'open_track'));