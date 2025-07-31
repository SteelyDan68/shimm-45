-- Update pillar activations to use Stefan's correct client_id instead of his user_id
UPDATE client_pillar_activations 
SET client_id = '9b4be572-9687-4a38-b13b-1e0584441379'
WHERE client_id = 'eab58843-5e82-4546-ad7c-55e4abccb6ab' 
AND user_id = 'eab58843-5e82-4546-ad7c-55e4abccb6ab';