-- MIGRERA DATA FRÅN GAMLA TABELLER (FIX FOR DUPLICATES)

-- Migrera roller från user_roles (endast unika kombinationer)
WITH unique_roles AS (
  SELECT DISTINCT user_id, role
  FROM public.user_roles
)
INSERT INTO public.user_attributes (user_id, attribute_key, attribute_value, attribute_type, created_by)
SELECT 
  user_id,
  'role_' || role::text, -- Unique key per role
  to_jsonb(role::text),
  'role',
  user_id
FROM unique_roles
ON CONFLICT (user_id, attribute_key) DO UPDATE SET
  attribute_value = EXCLUDED.attribute_value,
  updated_at = now(),
  is_active = true;

-- Migrera coach-client relationer (endast aktiva)
WITH unique_assignments AS (
  SELECT DISTINCT coach_id, client_id, assigned_at, assigned_by, is_active
  FROM public.coach_client_assignments
  WHERE is_active = true
)
INSERT INTO public.user_attributes (user_id, attribute_key, attribute_value, attribute_type, created_by)
SELECT 
  coach_id,
  'coach_client_' || client_id::text,
  jsonb_build_object(
    'client_id', client_id, 
    'assigned_at', assigned_at, 
    'is_active', is_active,
    'assigned_by', assigned_by
  ),
  'relationship',
  COALESCE(assigned_by, coach_id)
FROM unique_assignments
ON CONFLICT (user_id, attribute_key) DO UPDATE SET
  attribute_value = EXCLUDED.attribute_value,
  updated_at = now(),
  is_active = true;