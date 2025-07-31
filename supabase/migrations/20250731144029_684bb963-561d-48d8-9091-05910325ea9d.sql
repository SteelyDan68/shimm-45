-- Temporärt stäng av RLS på user_roles tabellen för utveckling
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Lägg till din superadmin rolle direkt
INSERT INTO public.user_roles (user_id, role) 
VALUES ('9065f42b-b9cc-4252-b73f-4374c6286b5e', 'superadmin')
ON CONFLICT (user_id, role) DO NOTHING;