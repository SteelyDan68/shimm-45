-- Återskapa hela app_role systemet från grunden

-- 1. Ta bort alla funktioner som använder app_role
DROP FUNCTION IF EXISTS has_role(uuid, app_role);
DROP FUNCTION IF EXISTS get_user_roles(uuid);
DROP FUNCTION IF EXISTS is_admin(uuid);

-- 2. Ta bort alla befintliga "user" roller
DELETE FROM user_roles WHERE role = 'user';

-- 3. Hantera default-värden
ALTER TABLE organization_members ALTER COLUMN role DROP DEFAULT;

-- 4. Skapa nya enum och uppdatera tabeller
DROP TYPE IF EXISTS app_role CASCADE;
CREATE TYPE app_role AS ENUM ('superadmin', 'admin', 'coach', 'client');

-- 5. Uppdatera tabeller
ALTER TABLE user_roles ALTER COLUMN role TYPE app_role USING role::text::app_role;
ALTER TABLE organization_members ALTER COLUMN role TYPE app_role USING role::text::app_role;

-- 6. Sätt nytt default
ALTER TABLE organization_members ALTER COLUMN role SET DEFAULT 'client'::app_role;

-- 7. Återskapa funktioner
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('superadmin', 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS SETOF app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
$$;