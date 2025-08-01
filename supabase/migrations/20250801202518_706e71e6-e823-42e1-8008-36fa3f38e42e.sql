-- Komplett refaktorering med CASCADE

-- 1. Ta bort alla funktioner och beroenden med CASCADE
DROP FUNCTION IF EXISTS has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS get_user_roles(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_admin(uuid) CASCADE;

-- 2. Ta bort app_role helt med CASCADE för att rensa alla beroenden
DROP TYPE IF EXISTS app_role CASCADE;

-- 3. Ta bort alla befintliga "user" roller först
DELETE FROM user_roles WHERE role = 'user';

-- 4. Hantera default-värden
ALTER TABLE organization_members ALTER COLUMN role DROP DEFAULT;

-- 5. Skapa ny app_role enum utan "user"
CREATE TYPE app_role AS ENUM ('superadmin', 'admin', 'coach', 'client');

-- 6. Uppdatera tabeller
ALTER TABLE user_roles ALTER COLUMN role TYPE app_role USING role::text::app_role;
ALTER TABLE organization_members ALTER COLUMN role TYPE app_role USING role::text::app_role;

-- 7. Sätt nytt default
ALTER TABLE organization_members ALTER COLUMN role SET DEFAULT 'client'::app_role;