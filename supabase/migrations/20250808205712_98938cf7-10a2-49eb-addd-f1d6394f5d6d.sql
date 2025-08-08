-- Återställ Stefan's superadmin-roll omedelbart
INSERT INTO public.user_roles (user_id, role, assigned_by, assigned_at)
VALUES ('9065f42b-b9cc-4252-b73f-4374c6286b5e', 'superadmin', '9065f42b-b9cc-4252-b73f-4374c6286b5e', now())
ON CONFLICT (user_id, role) DO NOTHING;

-- Kontrollera att rollen är tilldelad
SELECT user_id, role, assigned_by, assigned_at 
FROM public.user_roles 
WHERE user_id = '9065f42b-b9cc-4252-b73f-4374c6286b5e';