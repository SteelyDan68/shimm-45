-- Remove duplicate pillar activations for Stefan (the ones using user_id instead of client_id)
DELETE FROM client_pillar_activations 
WHERE client_id = 'eab58843-5e82-4546-ad7c-55e4abccb6ab';

-- Add missing pillar activations for the correct client ID
INSERT INTO client_pillar_activations (client_id, pillar_key, is_active, activated_by, activated_at)
VALUES 
  ('9b4be572-9687-4a38-b13b-1e0584441379', 'skills', true, 'eab58843-5e82-4546-ad7c-55e4abccb6ab', '2025-07-31 17:37:47.688274+00'),
  ('9b4be572-9687-4a38-b13b-1e0584441379', 'talent', true, 'eab58843-5e82-4546-ad7c-55e4abccb6ab', '2025-07-31 17:37:49.610281+00'),
  ('9b4be572-9687-4a38-b13b-1e0584441379', 'brand', true, 'eab58843-5e82-4546-ad7c-55e4abccb6ab', '2025-07-31 17:37:50.722555+00'),
  ('9b4be572-9687-4a38-b13b-1e0584441379', 'economy', true, 'eab58843-5e82-4546-ad7c-55e4abccb6ab', '2025-07-31 17:37:51.996445+00')
ON CONFLICT (client_id, pillar_key) DO NOTHING;