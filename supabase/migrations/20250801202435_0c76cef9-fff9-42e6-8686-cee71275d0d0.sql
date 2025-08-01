-- Ta bort ALLA policies som kan referera till app_role
DROP POLICY IF EXISTS "Superadmins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Coaches can view and update client profiles" ON public.profiles;

-- Ta bort alla policies på alla tabeller som använder app_role
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE qual LIKE '%app_role%' OR with_check LIKE '%app_role%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END
$$;

-- Nu ta bort "user" roller och ändra enum
DELETE FROM user_roles WHERE role = 'user';

-- Hantera default-värden
ALTER TABLE organization_members ALTER COLUMN role DROP DEFAULT;

-- Ändra enum
ALTER TYPE app_role RENAME TO app_role_old;
CREATE TYPE app_role AS ENUM ('superadmin', 'admin', 'coach', 'client');

-- Uppdatera tabeller
ALTER TABLE user_roles ALTER COLUMN role TYPE app_role USING role::text::app_role;
ALTER TABLE organization_members ALTER COLUMN role TYPE app_role USING role::text::app_role;

-- Sätt nytt default
ALTER TABLE organization_members ALTER COLUMN role SET DEFAULT 'client'::app_role;

-- Ta bort gamla enum
DROP TYPE app_role_old;