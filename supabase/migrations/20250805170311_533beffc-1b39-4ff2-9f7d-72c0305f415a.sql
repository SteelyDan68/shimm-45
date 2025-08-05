-- MIGRERA DATA FRÅN GAMLA TABELLER

-- Migrera roller från user_roles
INSERT INTO public.user_attributes (user_id, attribute_key, attribute_value, attribute_type, created_by)
SELECT 
  user_id,
  'role',
  to_jsonb(role::text),
  'role',
  user_id
FROM public.user_roles
ON CONFLICT (user_id, attribute_key) DO UPDATE SET
  attribute_value = EXCLUDED.attribute_value,
  updated_at = now(),
  is_active = true;

-- Migrera coach-client relationer
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
FROM public.coach_client_assignments
WHERE is_active = true
ON CONFLICT (user_id, attribute_key) DO UPDATE SET
  attribute_value = EXCLUDED.attribute_value,
  updated_at = now(),
  is_active = true;