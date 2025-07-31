-- Sätt upp Stefan Hallgren som superadmin-användare
-- Detta skapar/uppdaterar profilen och säkerställer superadmin-rollen

-- Först, sätt upp profilen för Stefan Hallgren
INSERT INTO public.profiles (
  id, 
  email, 
  first_name, 
  last_name,
  organization,
  job_title,
  bio,
  status,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid, -- Specifik UUID för Stefan
  'stefan.hallgren@gmail.com',
  'Stefan',
  'Hallgren',
  'Stefan Hallgren Consulting',
  'Superadmin & Systemutvecklare',
  'Grundare och huvudutvecklare av systemet. Ansvarig för teknisk utveckling och systemadministration.',
  'active',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  organization = EXCLUDED.organization,
  job_title = EXCLUDED.job_title,
  bio = EXCLUDED.bio,
  status = EXCLUDED.status,
  updated_at = now();

-- Säkerställ att Stefan har superadmin-rollen
INSERT INTO public.user_roles (
  user_id,
  role,
  assigned_by,
  assigned_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'superadmin',
  '550e8400-e29b-41d4-a716-446655440000'::uuid, -- Self-assigned
  now()
) ON CONFLICT (user_id, role) DO UPDATE SET
  assigned_at = now();

-- Ta bort eventuella andra roller för Stefan för att hålla det rent
DELETE FROM public.user_roles 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'::uuid 
AND role != 'superadmin';

-- Säkerställ att det finns meddelande-preferenser för Stefan
INSERT INTO public.message_preferences (
  user_id,
  email_notifications,
  internal_notifications,
  auto_ai_assistance,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  true,
  true,
  true,
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  updated_at = now();