-- Refaktorering: user_id som universell identifierare
-- Ta bort "user" som roll och gör roller helt optionella

-- 1. Ta bort alla befintliga "user" roller
DELETE FROM user_roles WHERE role = 'user';

-- 2. Uppdatera app_role enum - ta bort "user" som roll
ALTER TYPE app_role RENAME TO app_role_old;
CREATE TYPE app_role AS ENUM ('superadmin', 'admin', 'coach', 'client');

-- 3. Uppdatera user_roles tabellen med nya enum
ALTER TABLE user_roles ALTER COLUMN role TYPE app_role USING role::text::app_role;
ALTER TABLE organization_members ALTER COLUMN role TYPE app_role USING role::text::app_role;

-- 4. Ta bort gamla enum
DROP TYPE app_role_old;

-- 5. Uppdatera handle_new_user trigger - INGA automatiska roller
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Skapa bara profil, inga roller
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  
  -- INGEN automatisk rolltilldelning - roller hanteras separat
  RETURN NEW;
END;
$$;

-- 6. Uppdatera RLS policies för att hantera användare utan roller
-- Ta bort befintliga policies för profiles
DROP POLICY IF EXISTS "Superadmins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Coaches can view and update client profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Skapa nya policies som hanterar användare utan roller
CREATE POLICY "Superadmins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Admins can manage all profiles"  
ON public.profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches can view client profiles"
ON public.profiles  
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'coach') AND (
    auth.uid() = id OR 
    has_role(profiles.id, 'client')
  )
);

-- ALLA användare kan hantera sin egen profil (även utan roller)
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT  
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated  
USING (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 7. Skapa funktion för att hantera användare utan roller
CREATE OR REPLACE FUNCTION public.user_has_any_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- 8. Skapa funktion för att få default behörigheter för användare utan roller
CREATE OR REPLACE FUNCTION public.get_default_permissions(_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN user_has_any_role(_user_id) THEN '{}'::jsonb
    ELSE '{"can_edit_own_profile": true, "can_view_own_data": true, "can_use_stefan_chat": true}'::jsonb
  END
$$;