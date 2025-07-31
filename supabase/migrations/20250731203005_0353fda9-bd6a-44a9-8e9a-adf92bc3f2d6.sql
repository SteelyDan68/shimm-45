-- Fix pillar activations for Stefan - populate missing user_id fields
UPDATE client_pillar_activations 
SET user_id = 'eab58843-5e82-4546-ad7c-55e4abccb6ab' 
WHERE client_id = 'eab58843-5e82-4546-ad7c-55e4abccb6ab' 
AND user_id IS NULL;