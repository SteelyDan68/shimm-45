-- Refaktorering: user_id som universell identifierare
-- Steg 1: Ta bort policies som förhindrar enum-ändring

-- Ta bort alla policies som kan referera till user_roles.role kolumnen
DROP POLICY IF EXISTS "Coaches can view and update client profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Ta bort policies på user_roles tabellen som kan orsaka problem
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Ta bort policies på organization_members
DROP POLICY IF EXISTS "Admins can manage org memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Org members can view other members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view their org memberships" ON public.organization_members;

-- Nu kan vi ändra enum
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