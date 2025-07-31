-- Fix Stefan Hallgren setup och happyminds klient utan ON CONFLICT

-- 1. Säkerställ att Stefan Hallgren (gmail) har superadmin-roll
INSERT INTO public.user_roles (
  user_id,
  role,
  assigned_by,
  assigned_at
) 
SELECT 
  '9065f42b-b9cc-4252-b73f-4374c6286b5e',
  'superadmin',
  '9065f42b-b9cc-4252-b73f-4374c6286b5e',
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = '9065f42b-b9cc-4252-b73f-4374c6286b5e' 
  AND role = 'superadmin'
);

-- 2. Skapa klient-post för stefan.hallgren@happyminds.com (om den inte finns)
INSERT INTO public.clients (
  user_id,
  name,
  email,
  category,
  status,
  created_at,
  updated_at
)
SELECT 
  'eab58843-5e82-4546-ad7c-55e4abccb6ab',
  'Stefan Hallgren',
  'stefan.hallgren@happyminds.com',
  'Personlig utveckling',
  'active',
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.clients 
  WHERE user_id = 'eab58843-5e82-4546-ad7c-55e4abccb6ab'
);

-- 3. Ta bort user-rollen för happyminds användaren
DELETE FROM public.user_roles 
WHERE user_id = 'eab58843-5e82-4546-ad7c-55e4abccb6ab' 
AND role = 'user';