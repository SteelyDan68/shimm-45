-- Aktivera self_care pillar för happyminds klienten
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
  '9065f42b-b9cc-4252-b73f-4374c6286b5e', -- Stefan Hallgren (superadmin)
  now()
FROM public.clients c
WHERE c.user_id = 'eab58843-5e82-4546-ad7c-55e4abccb6ab'
AND NOT EXISTS (
  SELECT 1 FROM public.client_pillar_activations cpa
  WHERE cpa.client_id = c.id AND cpa.pillar_key = 'self_care'
);