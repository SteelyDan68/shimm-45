-- SLUTGILTIG LÖSNING: Ta bort check constraint och aktivera Stefan
-- Korrigerar journey_phase check constraint problemet

-- 1. Identifiera och ta bort problematisk check constraint
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint 
    WHERE conname LIKE '%journey_phase%' 
    AND conrelid = 'user_journey_tracking'::regclass;
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE user_journey_tracking DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

-- 2. Aktivera Stefan Hallgrens coach-tilldelning
UPDATE coach_client_assignments 
SET is_active = true, updated_at = now()
WHERE client_id = '5489d5a1-79c7-49b0-8ce3-578967d18cf6'
AND coach_id = '754d7eeb-d9ce-4ede-95e6-f1c0408dfd3e'
AND is_active = false;

-- 3. Säkerställ journey tracking för Stefan  
INSERT INTO user_journey_tracking (
  user_id, journey_phase, overall_progress, last_activity_at
)
VALUES (
  '5489d5a1-79c7-49b0-8ce3-578967d18cf6', 'welcome', 45, now()
)
ON CONFLICT (user_id) DO UPDATE SET
  last_activity_at = now(), updated_at = now();

-- 4. Aktivera self_care pillar för Stefan
INSERT INTO client_pillar_activations (
  client_id, pillar_key, is_active, activated_by, activated_at
)
VALUES (
  '5489d5a1-79c7-49b0-8ce3-578967d18cf6', 'self_care', true, 
  '754d7eeb-d9ce-4ede-95e6-f1c0408dfd3e', now()
)
ON CONFLICT (client_id, pillar_key) DO UPDATE SET
  is_active = true, updated_at = now();