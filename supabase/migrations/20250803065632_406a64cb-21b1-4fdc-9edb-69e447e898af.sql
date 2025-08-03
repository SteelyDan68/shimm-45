-- Fix duplicate coach-client assignments for Stefan Hallgren
-- Keep the most recent assignment (with superadmin Stefan as coach) and deactivate the older one

UPDATE coach_client_assignments 
SET is_active = false, updated_at = now()
WHERE client_id = '5489d5a1-79c7-49b0-8ce3-578967d18cf6' 
  AND coach_id = '754d7eeb-d9ce-4ede-95e6-f1c0408dfd3e'
  AND id = 'ce9b2c84-e346-4f15-8401-c6da47267ad9';

-- Add constraint to prevent multiple active coach assignments for same client  
CREATE UNIQUE INDEX idx_unique_active_client_coach 
ON coach_client_assignments (client_id) 
WHERE is_active = true;