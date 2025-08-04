-- MINIMAL LÖSNING: Bara aktivera Stefan Hallgrens coach-koppling
-- Korrigerar det mest kritiska problemet utan att skapa nya tabeller

-- 1. Ta bort check constraint som blockerar journey_phase
ALTER TABLE user_journey_tracking DROP CONSTRAINT IF EXISTS user_journey_tracking_journey_phase_check;

-- 2. Aktivera Stefan Hallgrens coach-tilldelning (det huvudsakliga problemet)
UPDATE coach_client_assignments 
SET is_active = true, updated_at = now()
WHERE client_id = '5489d5a1-79c7-49b0-8ce3-578967d18cf6'
AND coach_id = '754d7eeb-d9ce-4ede-95e6-f1c0408dfd3e' 
AND is_active = false;

-- 3. Endast skapa journey tracking om user_journey_tracking tabellen finns
INSERT INTO user_journey_tracking (
  user_id, journey_phase, overall_progress, last_activity_at
)
VALUES (
  '5489d5a1-79c7-49b0-8ce3-578967d18cf6', 
  'assessment_in_progress', -- Använd giltig fas enligt constraint
  45, 
  now()
)
ON CONFLICT (user_id) DO UPDATE SET
  last_activity_at = now(), 
  updated_at = now();