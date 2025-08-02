-- Återskapa coach-client relationer baserat på befintliga roller
-- Tilldela Stefan Hallgren (client) till Börje Sandhill (coach)

INSERT INTO public.coach_client_assignments (coach_id, client_id, assigned_by, assigned_at, is_active)
SELECT 
  (SELECT id FROM profiles WHERE email = 'borje.sandhill@gmail.com') as coach_id,
  (SELECT id FROM profiles WHERE email = 'stefan.hallgren@happyminds.com') as client_id,
  (SELECT id FROM profiles WHERE email = 'borje.sandhill@gmail.com') as assigned_by,
  now() as assigned_at,
  true as is_active
WHERE EXISTS (
  SELECT 1 FROM user_roles ur1 
  WHERE ur1.user_id = (SELECT id FROM profiles WHERE email = 'borje.sandhill@gmail.com') 
  AND ur1.role = 'coach'
)
AND EXISTS (
  SELECT 1 FROM user_roles ur2 
  WHERE ur2.user_id = (SELECT id FROM profiles WHERE email = 'stefan.hallgren@happyminds.com') 
  AND ur2.role = 'client'
);