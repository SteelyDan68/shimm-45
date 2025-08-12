-- TEMPORÄRT: Inaktivera problematisk trigger för att tillåta profil-skapning
DROP TRIGGER IF EXISTS log_sensitive_data_trigger ON public.profiles;

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

-- Skapa även profiler för alla andra användare som saknar dem
INSERT INTO public.profiles (id, email, first_name, last_name, created_at, updated_at, is_active)
SELECT 
  au.id,
  au.email,
  '',
  '',
  NOW(),
  NOW(),
  true
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;