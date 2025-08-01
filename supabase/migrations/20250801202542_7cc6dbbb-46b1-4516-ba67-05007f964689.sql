-- Återskapa hela rollsystemet från grunden

-- 1. Skapa ny app_role enum utan "user"
CREATE TYPE app_role AS ENUM ('superadmin', 'admin', 'coach', 'client');

-- 2. Återskapa role kolumnen på user_roles
ALTER TABLE user_roles ADD COLUMN role app_role NOT NULL;

-- 3. Återskapa role kolumnen på organization_members om den försvann
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'organization_members' 
                   AND column_name = 'role' 
                   AND table_schema = 'public') THEN
        ALTER TABLE organization_members ADD COLUMN role app_role DEFAULT 'client'::app_role;
    END IF;
END $$;

-- 4. Återskapa alla funktioner
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

-- 5. Skapa hjälpfunktioner för användare utan roller
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