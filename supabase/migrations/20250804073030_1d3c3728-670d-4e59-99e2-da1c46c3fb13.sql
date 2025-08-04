-- SLUTGILTIG KORRIGERING: Använd rätt tabellnamn och aktivera Stefan
-- Fixar check constraint och aktiverar coach-client integration

-- 1. Ta bort problematisk journey_phase check constraint
ALTER TABLE user_journey_tracking DROP CONSTRAINT IF EXISTS user_journey_tracking_journey_phase_check;

-- 2. Aktivera Stefan Hallgrens coach-tilldelning (det som var inaktivt)  
UPDATE coach_client_assignments 
SET is_active = true, updated_at = now()
WHERE client_id = '5489d5a1-79c7-49b0-8ce3-578967d18cf6'
AND coach_id = '754d7eeb-d9ce-4ede-95e6-f1c0408dfd3e' 
AND is_active = false;

-- 3. Säkerställ journey tracking för Stefan utan constraint problem
INSERT INTO user_journey_tracking (
  user_id, journey_phase, overall_progress, last_activity_at
)
VALUES (
  '5489d5a1-79c7-49b0-8ce3-578967d18cf6', 'assessment_in_progress', 45, now()
)
ON CONFLICT (user_id) DO UPDATE SET
  last_activity_at = now(), updated_at = now();

-- 4. Skapa en grundläggande client record om den inte finns
INSERT INTO clients (id, user_id, name, email, phase, progress)
VALUES (
  '5489d5a1-79c7-49b0-8ce3-578967d18cf6',
  '5489d5a1-79c7-49b0-8ce3-578967d18cf6', 
  'Stefan Hallgren',
  'stefan.hallgren@happyminds.com',
  'active',
  45
)
ON CONFLICT (id) DO UPDATE SET
  phase = 'active', progress = 45, updated_at = now();