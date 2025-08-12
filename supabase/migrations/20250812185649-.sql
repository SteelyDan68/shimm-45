-- KRITISK FIX: Automatisk profil-skapning för nya användare
-- Skapa funktion som automatiskt skapar profil när användare registreras

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Skapa trigger som anropas när ny användare skapas
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- AKUT FIX: Skapa profil för test14@shimms.com manuellt
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
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- Säkerställ att alla auth.users har motsvarande profiler
INSERT INTO public.profiles (id, email, first_name, last_name, created_at, updated_at, is_active)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'first_name', ''),
  COALESCE(au.raw_user_meta_data->>'last_name', ''),
  NOW(),
  NOW(),
  true
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();