-- Add superadmin role back to Stefan Hallgren
INSERT INTO public.user_roles (user_id, role) 
SELECT '9065f42b-b9cc-4252-b73f-4374c6286b5e', 'superadmin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = '9065f42b-b9cc-4252-b73f-4374c6286b5e' 
  AND role = 'superadmin'
);

-- Also add coach role for pillar management
INSERT INTO public.user_roles (user_id, role) 
SELECT '9065f42b-b9cc-4252-b73f-4374c6286b5e', 'coach'
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = '9065f42b-b9cc-4252-b73f-4374c6286b5e' 
  AND role = 'coach'
);