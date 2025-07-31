-- Fix Stefan Hallgren superadmin setup och skapa klient för happyminds användaren

-- 1. Säkerställ att Stefan Hallgren (gmail) har superadmin-roll
INSERT INTO public.user_roles (
  user_id,
  role,
  assigned_by,
  assigned_at
) VALUES (
  '9065f42b-b9cc-4252-b73f-4374c6286b5e',
  'superadmin',
  '9065f42b-b9cc-4252-b73f-4374c6286b5e',
  now()
) ON CONFLICT (user_id, role) DO UPDATE SET
  assigned_at = now();

-- 2. Skapa klient-post för stefan.hallgren@happyminds.com
INSERT INTO public.clients (
  id,
  user_id,
  name,
  email,
  category,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'eab58843-5e82-4546-ad7c-55e4abccb6ab',
  'Stefan Hallgren',
  'stefan.hallgren@happyminds.com',
  'Personlig utveckling',
  'active',
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = now();

-- 3. Säkerställ att happyminds användaren endast har client-rollen (ta bort user-rollen)
DELETE FROM public.user_roles 
WHERE user_id = 'eab58843-5e82-4546-ad7c-55e4abccb6ab' 
AND role = 'user';

-- 4. Aktivera self_care pillar för den nya klienten (standard)
INSERT INTO public.client_pillar_activations (
  client_id,
  pillar_key,
  is_active,
  activated_by,
  activated_at
)
SELECT 
  c.id,
  'self_care',
  true,
  '9065f42b-b9cc-4252-b73f-4374c6286b5e',
  now()
FROM public.clients c
WHERE c.user_id = 'eab58843-5e82-4546-ad7c-55e4abccb6ab'
ON CONFLICT (client_id, pillar_key) DO NOTHING;