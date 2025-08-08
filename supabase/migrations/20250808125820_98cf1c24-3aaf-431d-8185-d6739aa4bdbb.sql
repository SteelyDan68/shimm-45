-- Create Stefan AI profile (only in public schema)
INSERT INTO profiles (
  id,
  first_name,
  last_name,
  email,
  avatar_url,
  is_active,
  created_at,
  updated_at,
  bio
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Stefan',
  'AI',
  'stefan.ai@happyminds.internal',
  null,
  true,
  now(),
  now(),
  'AI-assistent för coaching och utveckling'
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  bio = EXCLUDED.bio,
  updated_at = now();

-- Assign AI assistant role to Stefan  
INSERT INTO user_roles (
  user_id,
  role,
  assigned_by,
  assigned_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'client'::app_role,
  '00000000-0000-0000-0000-000000000001'::uuid,
  now()
) ON CONFLICT (user_id, role) DO NOTHING;

-- Create a special attribute to mark Stefan as AI
INSERT INTO user_attributes (
  user_id,
  attribute_key,
  attribute_value,
  is_active,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'entity_type',
  '"ai_assistant"'::jsonb,
  true,
  now(),
  now()
) ON CONFLICT (user_id, attribute_key) DO UPDATE SET
  attribute_value = EXCLUDED.attribute_value,
  is_active = true,
  updated_at = now();