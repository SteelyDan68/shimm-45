-- Refaktorering: user_id som universell identifierare
-- Hantera default-värden och enum-ändring korrekt

-- 1. Ta bort alla befintliga "user" roller
DELETE FROM user_roles WHERE role = 'user';

-- 2. Hantera default-värden först
ALTER TABLE organization_members ALTER COLUMN role DROP DEFAULT;

-- 3. Uppdatera app_role enum - ta bort "user" som roll
ALTER TYPE app_role RENAME TO app_role_old;
CREATE TYPE app_role AS ENUM ('superadmin', 'admin', 'coach', 'client');

-- 4. Uppdatera user_roles tabellen med nya enum
ALTER TABLE user_roles ALTER COLUMN role TYPE app_role USING role::text::app_role;
ALTER TABLE organization_members ALTER COLUMN role TYPE app_role USING role::text::app_role;

-- 5. Sätt nytt default för organization_members (client som fallback)
ALTER TABLE organization_members ALTER COLUMN role SET DEFAULT 'client'::app_role;

-- 6. Ta bort gamla enum
DROP TYPE app_role_old;