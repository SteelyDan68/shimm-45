-- ========================================================
-- PHASE 4: DATABASE SCHEMA CONSOLIDATION
-- Single Source of Truth: user_id only (no client_id, coach_id)
-- ========================================================

-- STEP 1: UPDATE TABLES TO USE user_id CONSISTENTLY
-- Note: Many tables already use user_id correctly, we're fixing the exceptions

-- Fix coach_client_assignments table to use clear naming
-- (Keep existing structure but clarify column purposes)
DO $$
BEGIN
  -- Add comments to clarify purpose
  COMMENT ON COLUMN coach_client_assignments.coach_id IS 'user_id of the coach (references profiles.id)';
  COMMENT ON COLUMN coach_client_assignments.client_id IS 'user_id of the client (references profiles.id)';
END $$;

-- STEP 2: UPDATE client_data_cache to use user_id instead of client_id
-- First add the new column
ALTER TABLE client_data_cache ADD COLUMN IF NOT EXISTS user_id UUID;

-- Copy data from client_id to user_id (they're the same concept)
UPDATE client_data_cache 
SET user_id = client_id 
WHERE user_id IS NULL AND client_id IS NOT NULL;

-- Make user_id NOT NULL after data migration
ALTER TABLE client_data_cache ALTER COLUMN user_id SET NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_client_data_cache_user_id ON client_data_cache(user_id);

-- STEP 3: CREATE VIEW for backwards compatibility
CREATE OR REPLACE VIEW client_data_cache_legacy AS
SELECT 
  id,
  data_type,
  source,
  data,
  created_at,
  expires_at,
  title,
  url,
  snippet,
  author,
  image,
  platform,
  metadata,
  data_quality_score,
  competitive_insights,
  last_sentiment_analysis,
  user_id as client_id,  -- Map user_id back to client_id for compatibility
  user_id              -- Also expose user_id
FROM client_data_cache;

-- STEP 4: Update RLS policies to be user_id aware
-- Drop old policies
DROP POLICY IF EXISTS "Admins can manage all client data cache" ON client_data_cache;
DROP POLICY IF EXISTS "Admins can view all client data cache" ON client_data_cache;
DROP POLICY IF EXISTS "Users can manage their own data cache" ON client_data_cache;
DROP POLICY IF EXISTS "Users can view their own data cache" ON client_data_cache;

-- Create new unified policies using user_id
CREATE POLICY "Superadmin god mode - client_data_cache"
ON client_data_cache FOR ALL
USING (superadmin_god_mode(auth.uid()))
WITH CHECK (superadmin_god_mode(auth.uid()));

CREATE POLICY "Admins can manage all user data cache"
ON client_data_cache FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can manage their own data cache"
ON client_data_cache FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- STEP 5: Update client_pillar_activations to be clearer about user_id
-- Add comment to clarify that client_id is actually user_id
COMMENT ON COLUMN client_pillar_activations.client_id IS 'This is actually user_id (legacy naming)';
COMMENT ON COLUMN client_pillar_activations.user_id IS 'This should be the primary user identifier';

-- Ensure user_id is populated from client_id where missing
UPDATE client_pillar_activations 
SET user_id = client_id 
WHERE user_id IS NULL AND client_id IS NOT NULL;

-- STEP 6: Create unified metadata view for user context
CREATE OR REPLACE VIEW user_context_view AS
SELECT 
  p.id as user_id,
  p.email,
  p.first_name,
  p.last_name,
  p.avatar_url,
  p.created_at,
  p.updated_at,
  array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL) as roles,
  CASE 
    WHEN 'client' = ANY(array_agg(ur.role)) THEN 'client'
    WHEN 'coach' = ANY(array_agg(ur.role)) THEN 'coach'  
    WHEN 'admin' = ANY(array_agg(ur.role)) THEN 'admin'
    WHEN 'superadmin' = ANY(array_agg(ur.role)) THEN 'superadmin'
    ELSE 'user'
  END as primary_role,
  CASE 
    WHEN 'superadmin' = ANY(array_agg(ur.role)) THEN 100
    WHEN 'admin' = ANY(array_agg(ur.role)) THEN 80
    WHEN 'coach' = ANY(array_agg(ur.role)) THEN 60
    WHEN 'client' = ANY(array_agg(ur.role)) THEN 40
    ELSE 20
  END as permission_level
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
GROUP BY p.id, p.email, p.first_name, p.last_name, p.avatar_url, p.created_at, p.updated_at;

-- STEP 7: Create function to resolve user context
CREATE OR REPLACE FUNCTION get_user_context(target_user_id UUID)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  full_name TEXT,
  roles TEXT[],
  primary_role TEXT,
  permission_level INTEGER,
  can_access BOOLEAN
) LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT 
    ucv.user_id,
    ucv.email,
    COALESCE(ucv.first_name || ' ' || ucv.last_name, ucv.email) as full_name,
    ucv.roles,
    ucv.primary_role,
    ucv.permission_level,
    CASE
      -- Superadmin god mode
      WHEN superadmin_god_mode(auth.uid()) THEN true
      -- Self access
      WHEN auth.uid() = target_user_id THEN true
      -- Admin access
      WHEN is_admin(auth.uid()) THEN true
      -- Coach access to their clients
      WHEN EXISTS (
        SELECT 1 FROM coach_client_assignments cca 
        WHERE cca.coach_id = auth.uid() 
        AND cca.client_id = target_user_id 
        AND cca.is_active = true
      ) THEN true
      ELSE false
    END as can_access
  FROM user_context_view ucv
  WHERE ucv.user_id = target_user_id;
$$;

-- STEP 8: Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup ON user_roles(user_id, role);
CREATE INDEX IF NOT EXISTS idx_coach_client_active ON coach_client_assignments(coach_id, client_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- STEP 9: Log the consolidation
INSERT INTO analytics_events (
  event, 
  properties, 
  timestamp,
  session_id
) VALUES (
  'schema_consolidation_completed',
  jsonb_build_object(
    'phase', '4',
    'description', 'Single Source of Truth: user_id consolidation',
    'tables_updated', array['client_data_cache', 'client_pillar_activations'],
    'views_created', array['client_data_cache_legacy', 'user_context_view'],
    'functions_created', array['get_user_context']
  ),
  now(),
  'system_migration'
);