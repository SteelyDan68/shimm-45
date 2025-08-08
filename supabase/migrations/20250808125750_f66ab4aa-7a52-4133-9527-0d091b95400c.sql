-- Create Stefan AI as a system user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  is_super_admin,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_sso_user,
  deleted_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'stefan.ai@happyminds.internal',
  '$2a$10$encrypted_placeholder_password',
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  '',
  false,
  now(),
  '{"provider":"internal","providers":["internal"],"role":"ai_assistant"}',
  '{"first_name":"Stefan","last_name":"AI","full_name":"Stefan AI","avatar_url":null,"role":"ai_assistant","is_ai":true}',
  false,
  null
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  raw_app_meta_data = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = now();

-- Create Stefan AI profile
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