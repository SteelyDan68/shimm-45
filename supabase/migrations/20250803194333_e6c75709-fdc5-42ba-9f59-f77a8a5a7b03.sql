-- ========================================================
-- PHASE 1: ELIMINATE CLIENT_ID FROM DATABASE FOREVER (CORRECTED)
-- Single Source of Truth: USER_ID ONLY
-- ========================================================

-- 1. Update coach_client_assignments to use user_id semantics consistently
-- Note: These are already user_ids but with confusing names
COMMENT ON COLUMN coach_client_assignments.coach_id IS 'This is actually a user_id - the user who has coach role';
COMMENT ON COLUMN coach_client_assignments.client_id IS 'This is actually a user_id - the user who has client role';

-- 2. Drop all client_id columns from tables that have both user_id and client_id
-- First, ensure data consistency by copying client_id data to user_id where missing

-- Update client_data_cache: remove client_id column (user_id is the truth)
UPDATE client_data_cache 
SET user_id = client_id 
WHERE user_id IS NULL AND client_id IS NOT NULL;

ALTER TABLE client_data_cache DROP COLUMN IF EXISTS client_id;

-- Update client_pillar_activations: remove client_id column (user_id is the truth)  
UPDATE client_pillar_activations 
SET user_id = client_id 
WHERE user_id IS NULL AND client_id IS NOT NULL;

ALTER TABLE client_pillar_activations DROP COLUMN IF EXISTS client_id;

-- Update client_pillar_assignments: remove client_id column
UPDATE client_pillar_assignments 
SET user_id = client_id 
WHERE user_id IS NULL AND client_id IS NOT NULL;

ALTER TABLE client_pillar_assignments DROP COLUMN IF EXISTS client_id;

-- 3. Rename tables to reflect user-centric approach
ALTER TABLE client_data_cache RENAME TO user_data_cache;
ALTER TABLE client_data_containers RENAME TO user_data_containers;
ALTER TABLE client_pillar_activations RENAME TO user_pillar_activations;
ALTER TABLE client_pillar_assignments RENAME TO user_pillar_assignments;

-- 4. Update weekly_email_logs to use user_id instead of client_id
ALTER TABLE weekly_email_logs RENAME COLUMN client_id TO user_id;

-- 5. Create function to get user context (roles and relationships) - CORRECTED TYPE HANDLING
CREATE OR REPLACE FUNCTION public.get_user_roles_and_relationships(target_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  roles app_role[],
  coach_relationships uuid[],
  client_relationships uuid[]
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    target_user_id as user_id,
    COALESCE(
      array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL), 
      ARRAY[]::app_role[]
    ) as roles,
    COALESCE(
      array_agg(DISTINCT cca_as_coach.client_id) FILTER (WHERE cca_as_coach.client_id IS NOT NULL),
      ARRAY[]::uuid[]
    ) as coach_relationships,
    COALESCE(
      array_agg(DISTINCT cca_as_client.coach_id) FILTER (WHERE cca_as_client.coach_id IS NOT NULL),
      ARRAY[]::uuid[]
    ) as client_relationships
  FROM (SELECT target_user_id) base
  LEFT JOIN user_roles ur ON ur.user_id = target_user_id
  LEFT JOIN coach_client_assignments cca_as_coach ON cca_as_coach.coach_id = target_user_id AND cca_as_coach.is_active = true
  LEFT JOIN coach_client_assignments cca_as_client ON cca_as_client.client_id = target_user_id AND cca_as_client.is_active = true
  GROUP BY target_user_id;
$$;

-- 6. Add helpful comments to clarify the new architecture
COMMENT ON TABLE profiles IS 'Single source of truth for all users. Roles are managed via user_roles table.';
COMMENT ON TABLE user_roles IS 'Associates roles (admin, coach, client, etc.) to user_id. One user can have multiple roles.';
COMMENT ON TABLE coach_client_assignments IS 'Relationships between users in coach and client contexts. Both coach_id and client_id are user_ids from profiles table.';