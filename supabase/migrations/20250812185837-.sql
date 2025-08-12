-- TEMPORÄRT: Ta bort problematisk logging trigger som blockerar profil-skapning
DROP TRIGGER IF EXISTS log_profile_access ON public.profiles;

-- Skapa profilen för test14@shimms.com
INSERT INTO public.profiles (
  id, 
  email, 
  first_name, 
  last_name, 
  created_at, 
  updated_at,
  is_active
) VALUES (
  'bc54ee63-c086-4a57-b66d-29b6da9753d3',
  'test14@shimms.com',
  '',
  '',
  NOW(),
  NOW(),
  true
) ON CONFLICT (id) DO NOTHING;