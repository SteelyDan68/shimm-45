-- KORRIGERING: Använd befintliga tabeller och aktivera Stefan Hallgren
-- Aktiverar coach-tilldelningen för Stefan utan att skapa nya kolumner

-- 1. Aktivera Stefan Hallgrens coach-koppling
UPDATE coach_client_assignments 
SET 
  is_active = true,
  updated_at = now()
WHERE client_id = '5489d5a1-79c7-49b0-8ce3-578967d18cf6'  -- Stefan Hallgren
AND coach_id = '754d7eeb-d9ce-4ede-95e6-f1c0408dfd3e'     -- Börje Sandhill  
AND is_active = false;

-- 2. Skapa user_journey_tracking för Stefan (utan problematiska constraints)
INSERT INTO user_journey_tracking (
  user_id,
  journey_phase,
  overall_progress,
  last_activity_at,
  created_at,
  updated_at
)
VALUES (
  '5489d5a1-79c7-49b0-8ce3-578967d18cf6',  -- Stefan Hallgren
  'welcome',
  45,
  now(),
  now(),
  now()
)
ON CONFLICT (user_id) 
DO UPDATE SET
  last_activity_at = now(),
  updated_at = now();

-- 3. Aktivera self_care pillar för Stefan i client_pillar_activations (utan progress kolumn)
INSERT INTO client_pillar_activations (
  client_id,
  pillar_key,
  is_active,
  activated_by,
  activated_at
)
VALUES (
  '5489d5a1-79c7-49b0-8ce3-578967d18cf6',  -- Stefan Hallgren
  'self_care',
  true,
  '754d7eeb-d9ce-4ede-95e6-f1c0408dfd3e',  -- Börje Sandhill
  now()
)
ON CONFLICT (client_id, pillar_key) 
DO UPDATE SET
  is_active = true,
  updated_at = now();