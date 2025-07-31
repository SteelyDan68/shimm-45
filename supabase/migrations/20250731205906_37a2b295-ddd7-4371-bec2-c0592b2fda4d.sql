-- Fix the client_pillar_activations table to use both client_id and user_id for backward compatibility
-- Add client_id as optional column for database transition period

ALTER TABLE client_pillar_activations 
ALTER COLUMN client_id DROP NOT NULL;

-- Update any existing records to have client_id same as user_id for compatibility
UPDATE client_pillar_activations 
SET client_id = user_id 
WHERE client_id IS NULL;