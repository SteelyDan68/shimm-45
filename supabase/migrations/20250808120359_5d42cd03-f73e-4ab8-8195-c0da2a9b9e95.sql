-- ================================================
-- KRITISK CONSTRAINT FIX FÖR OPEN_TRACK INTEGRATION
-- Uppdaterar ALLA pillar constraints för fullständig kompatibilitet
-- ================================================

-- 1. FIX ASSESSMENT_ROUNDS CONSTRAINT
ALTER TABLE assessment_rounds 
DROP CONSTRAINT IF EXISTS assessment_rounds_pillar_type_check;

ALTER TABLE assessment_rounds 
ADD CONSTRAINT assessment_rounds_pillar_type_check 
CHECK (pillar_type = ANY (ARRAY['self_care'::text, 'skills'::text, 'talent'::text, 'brand'::text, 'economy'::text, 'open_track'::text]));

-- 2. FIX CLIENT_PILLAR_ACTIVATIONS CONSTRAINT
ALTER TABLE client_pillar_activations 
DROP CONSTRAINT IF EXISTS client_pillar_activations_pillar_key_check;

ALTER TABLE client_pillar_activations 
ADD CONSTRAINT client_pillar_activations_pillar_key_check 
CHECK (pillar_key = ANY (ARRAY['self_care'::text, 'skills'::text, 'talent'::text, 'brand'::text, 'economy'::text, 'open_track'::text]));

-- 3. FIX CLIENT_PILLAR_ASSIGNMENTS CONSTRAINT  
ALTER TABLE client_pillar_assignments 
DROP CONSTRAINT IF EXISTS client_pillar_assignments_pillar_type_check;

ALTER TABLE client_pillar_assignments 
ADD CONSTRAINT client_pillar_assignments_pillar_type_check 
CHECK (pillar_type = ANY (ARRAY['self_care'::text, 'skills'::text, 'talent'::text, 'brand'::text, 'economy'::text, 'open_track'::text]));

-- 4. FIX PILLAR_VISUALIZATION_DATA CONSTRAINT
ALTER TABLE pillar_visualization_data 
DROP CONSTRAINT IF EXISTS pillar_visualization_data_pillar_key_check;

ALTER TABLE pillar_visualization_data 
ADD CONSTRAINT pillar_visualization_data_pillar_key_check 
CHECK (pillar_key = ANY (ARRAY['self_care'::text, 'skills'::text, 'talent'::text, 'brand'::text, 'economy'::text, 'open_track'::text]));

-- 5. FIX CALENDAR_ACTIONABLES CONSTRAINT (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_actionables') THEN
    -- Drop constraint if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'calendar_actionables_pillar_key_check') THEN
      ALTER TABLE calendar_actionables DROP CONSTRAINT calendar_actionables_pillar_key_check;
    END IF;
    
    -- Add new constraint with open_track
    ALTER TABLE calendar_actionables 
    ADD CONSTRAINT calendar_actionables_pillar_key_check 
    CHECK (pillar_key = ANY (ARRAY['self_care'::text, 'skills'::text, 'talent'::text, 'brand'::text, 'economy'::text, 'open_track'::text]));
  END IF;
END $$;

-- 6. VERIFY ALL CONSTRAINTS ARE UPDATED
-- This will return all pillar-related constraints for verification
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname LIKE '%pillar%' 
  AND contype = 'c'  -- Check constraints only
ORDER BY conrelid::regclass, conname;

-- 7. AUDIT LOG CONSTRAINT FIXES
INSERT INTO admin_audit_log (
  admin_user_id,
  action,
  details
) VALUES (
  '3724384a-a36a-436f-b888-0b782652ba2a',
  'constraint_fix_open_track_integration',
  jsonb_build_object(
    'migration_type', 'constraint_updates',
    'constraints_updated', jsonb_build_array(
      'assessment_rounds_pillar_type_check',
      'client_pillar_activations_pillar_key_check', 
      'client_pillar_assignments_pillar_type_check',
      'pillar_visualization_data_pillar_key_check',
      'calendar_actionables_pillar_key_check'
    ),
    'added_pillar', 'open_track',
    'timestamp', now(),
    'status', 'constraints_fixed'
  )
);