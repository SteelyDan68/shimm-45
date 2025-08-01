-- Lägg till role kolumner och funktioner (app_role finns redan)

-- 1. Lägg till role kolumn på user_roles om den saknas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_roles' 
                   AND column_name = 'role' 
                   AND table_schema = 'public') THEN
        ALTER TABLE user_roles ADD COLUMN role app_role NOT NULL;
    END IF;
END $$;

-- 2. Lägg till role kolumn på organization_members om den saknas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'organization_members' 
                   AND column_name = 'role' 
                   AND table_schema = 'public') THEN
        ALTER TABLE organization_members ADD COLUMN role app_role DEFAULT 'client'::app_role;
    END IF;
END $$;

-- 3. Återskapa alla funktioner
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

-- 4. Skapa hjälpfunktioner för användare utan roller
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