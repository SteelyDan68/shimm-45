-- Fix security issues from Phase 1 migration

-- Update helper functions with proper search_path setting
CREATE OR REPLACE FUNCTION get_user_id_from_client_id(client_uuid UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT user_id FROM clients WHERE id = client_uuid;
$$;

CREATE OR REPLACE FUNCTION get_client_id_from_user_id(user_uuid UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT id FROM clients WHERE user_id = user_uuid LIMIT 1;
$$;