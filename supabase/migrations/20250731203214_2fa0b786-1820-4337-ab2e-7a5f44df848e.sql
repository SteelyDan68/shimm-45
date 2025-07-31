-- Delete the incorrect pillar activations (where client_id = user_id)
DELETE FROM client_pillar_activations 
WHERE client_id = 'eab58843-5e82-4546-ad7c-55e4abccb6ab' 
AND user_id = 'eab58843-5e82-4546-ad7c-55e4abccb6ab';