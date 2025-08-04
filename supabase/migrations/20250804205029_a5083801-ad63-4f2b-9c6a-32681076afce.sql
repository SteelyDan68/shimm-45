-- Skapa Stefan AI system-profil för konversationer
INSERT INTO profiles (id, first_name, last_name, email) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Stefan',
  'AI',
  'stefan@system.ai'
) 
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email;