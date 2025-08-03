-- CLEANUP: Remove old client_id system and consolidate to user_id only
-- This migration removes the old client_id references and makes user_id the single source of truth

-- 1. First, let's see what's in coach_client_assignments
-- Update coach_client_assignments to be clearer about user_id usage
COMMENT ON TABLE coach_client_assignments IS 'Maps coaches to clients using user_id as the identifier. client_id column stores user_id values.';

-- 2. Ensure all client_pillar_activations use user_id properly
-- First, update existing records where user_id is null but client_id exists
UPDATE client_pillar_activations 
SET user_id = client_id 
WHERE user_id IS NULL AND client_id IS NOT NULL;

-- 3. Update client_data_cache to use user_id properly
UPDATE client_data_cache 
SET user_id = client_id 
WHERE user_id IS NULL AND client_id IS NOT NULL;

-- 4. Add check to ensure user_id is always populated in critical tables
ALTER TABLE client_pillar_activations 
ADD CONSTRAINT ensure_user_id_not_null 
CHECK (user_id IS NOT NULL);

ALTER TABLE client_data_cache 
ADD CONSTRAINT ensure_user_id_not_null_cache 
CHECK (user_id IS NOT NULL);

-- 5. Create indexes on user_id for performance
CREATE INDEX IF NOT EXISTS idx_client_pillar_activations_user_id ON client_pillar_activations(user_id);
CREATE INDEX IF NOT EXISTS idx_client_data_cache_user_id ON client_data_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_client_assignments_client_id ON coach_client_assignments(client_id);

-- 6. Add helpful comments to clarify the unified system
COMMENT ON COLUMN coach_client_assignments.client_id IS 'Stores user_id of the client. In the unified system, client_id = user_id.';
COMMENT ON COLUMN client_pillar_activations.user_id IS 'The user_id is the single source of truth. client_id is legacy.';
COMMENT ON COLUMN client_data_cache.user_id IS 'The user_id is the single source of truth. client_id is legacy.';