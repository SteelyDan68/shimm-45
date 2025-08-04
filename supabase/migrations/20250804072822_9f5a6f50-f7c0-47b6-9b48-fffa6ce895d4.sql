-- FIX DATABASE CONSTRAINTS AND COACH-CLIENT ACTIVATIONS
-- Korrigerar check constraint och aktiverar coach-client kopplingar

-- 1. Ta bort felaktig check constraint om den finns
ALTER TABLE user_journey_tracking DROP CONSTRAINT IF EXISTS user_journey_tracking_journey_phase_check;

-- 2. Aktivera Stefan Hallgrens coach-koppling (om den inte redan är aktiv)
UPDATE coach_client_assignments 
SET 
  is_active = true,
  updated_at = now()
WHERE client_id = '5489d5a1-79c7-49b0-8ce3-578967d18cf6'  -- Stefan Hallgren
AND coach_id = '754d7eeb-d9ce-4ede-95e6-f1c0408dfd3e'     -- Börje Sandhill  
AND is_active = false;

-- 3. Skapa user_journey_tracking för Stefan med korrekt fas
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
  'welcome',  -- Använd giltig fas
  45,
  now(),
  now(),
  now()
)
ON CONFLICT (user_id) 
DO UPDATE SET
  last_activity_at = now(),
  updated_at = now();

-- 4. Aktivera self_care pillar för Stefan i user_pillar_activations
INSERT INTO user_pillar_activations (
  user_id,
  pillar_key,
  is_active,
  progress,
  activated_by,
  activated_at
)
VALUES (
  '5489d5a1-79c7-49b0-8ce3-578967d18cf6',  -- Stefan Hallgren
  'self_care',
  true,
  25,
  '754d7eeb-d9ce-4ede-95e6-f1c0408dfd3e',  -- Börje Sandhill
  now()
)
ON CONFLICT (user_id, pillar_key) 
DO UPDATE SET
  is_active = true,
  progress = 25,
  updated_at = now();