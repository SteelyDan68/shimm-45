-- Create an access code for superuser access
INSERT INTO public.access_codes (code, status, created_by, created_at)
VALUES ('ADMIN2025', 'active', (SELECT id FROM auth.users LIMIT 1), now());