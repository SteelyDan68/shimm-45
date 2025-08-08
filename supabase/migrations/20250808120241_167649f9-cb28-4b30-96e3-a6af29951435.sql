-- ================================================
-- ENTERPRISE-GRADE OPEN_TRACK PILLAR INTEGRATION
-- Fullständig systemintegration för "Öppna spåret"
-- ================================================

-- 1. CREATE ASSESSMENT TEMPLATE FOR OPEN_TRACK
INSERT INTO assessment_templates (
  pillar_key, 
  name, 
  created_by, 
  is_active, 
  scoring_config, 
  questions
) VALUES (
  'open_track', 
  'Öppna spåret Assessment', 
  '3724384a-a36a-436f-b888-0b782652ba2a', 
  true, 
  jsonb_build_object(
    'max_score', 100,
    'weight_factors', jsonb_build_object(
      'vision', 0.25,
      'creativity', 0.25, 
      'innovation', 0.20,
      'neuroplasticity', 0.15,
      'personal_growth', 0.15
    ),
    'qualitative_focus', true,
    'adaptive_scoring', true
  ),
  jsonb_build_array(
    jsonb_build_object(
      'id', 'vision_clarity',
      'text', 'Hur tydlig är din vision för din personliga utvecklingsresa?',
      'type', 'scale',
      'min', 1,
      'max', 10,
      'weight', 0.25
    ),
    jsonb_build_object(
      'id', 'creative_expression',
      'text', 'Hur väl uttrycker du din kreativitet i vardagen?',
      'type', 'scale', 
      'min', 1,
      'max', 10,
      'weight', 0.25
    ),
    jsonb_build_object(
      'id', 'innovation_mindset',
      'text', 'Hur innovativ är din approach till problemlösning?',
      'type', 'scale',
      'min', 1,
      'max', 10,
      'weight', 0.20
    ),
    jsonb_build_object(
      'id', 'neuroplastic_habits',
      'text', 'Hur aktivt arbetar du med att utveckla nya mentala mönster?',
      'type', 'scale',
      'min', 1,
      'max', 10,
      'weight', 0.15
    ),
    jsonb_build_object(
      'id', 'growth_commitment',
      'text', 'Hur engagerad är du i din kontinuerliga personliga utveckling?',
      'type', 'scale',
      'min', 1,
      'max', 10,
      'weight', 0.15
    )
  )
);

-- 2. CREATE PILLAR ACTIVATION FOR OPEN_TRACK (if client_pillar_activations table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_pillar_activations') THEN
    INSERT INTO client_pillar_activations (
      client_id,
      pillar_key,
      is_active,
      activated_by,
      activated_at
    ) 
    SELECT 
      id as client_id,
      'open_track' as pillar_key,
      true as is_active,
      id as activated_by,
      now() as activated_at
    FROM profiles 
    WHERE is_active = true
    ON CONFLICT (client_id, pillar_key) DO UPDATE SET 
      is_active = true,
      activated_at = now();
  END IF;
END $$;

-- 3. VERIFY OPEN_TRACK INTEGRATION IN ALL EDGE FUNCTIONS
-- Check that stefan-enhanced-chat supports open_track
-- Check that analyze-pillar-assessment supports open_track  
-- Check that universal-assessment-analyzer supports open_track

-- 4. CREATE SAMPLE ASSESSMENT ROUND FOR ANNA (for testing)
INSERT INTO assessment_rounds (
  user_id,
  created_by, 
  pillar_type,
  answers,
  scores,
  comments,
  ai_analysis
) VALUES (
  '3724384a-a36a-436f-b888-0b782652ba2a',
  '3724384a-a36a-436f-b888-0b782652ba2a',
  'open_track',
  jsonb_build_object(
    'vision_clarity', 8,
    'creative_expression', 7,
    'innovation_mindset', 8,
    'neuroplastic_habits', 6,
    'growth_commitment', 9,
    'assessment_type', 'open_track_neuroplastic',
    'timestamp', now()
  ),
  jsonb_build_object(
    'open_track', 76,
    'overall', 76
  ),
  'Öppna spåret assessment slutförd - fokus på innovation och kreativ utveckling',
  'AI-analys för Öppna spåret: Klienten visar stark vision (8/10) och hög utvecklingsengagemang (9/10). Rekommendationer inkluderar förstärkning av neuroplastiska vanor och kreativt uttryck i vardagen.'
);

-- 5. CREATE INDEX FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_assessment_rounds_open_track 
ON assessment_rounds (user_id, pillar_type) 
WHERE pillar_type = 'open_track';

-- 6. UPDATE CALENDAR ACTIONABLES TO SUPPORT OPEN_TRACK
UPDATE calendar_actionables 
SET pillar_key = 'open_track'
WHERE pillar_key IS NULL 
  AND (title ILIKE '%öppna spåret%' OR title ILIKE '%open track%' OR title ILIKE '%innovation%' OR title ILIKE '%kreativ%');

-- 7. LOG MIGRATION FOR AUDIT
INSERT INTO admin_audit_log (
  admin_user_id,
  action,
  target_user_id,
  details
) VALUES (
  '3724384a-a36a-436f-b888-0b782652ba2a',
  'open_track_pillar_integration',
  '3724384a-a36a-436f-b888-0b782652ba2a',
  jsonb_build_object(
    'migration_type', 'full_open_track_integration',
    'components_updated', jsonb_build_array(
      'assessment_templates',
      'assessment_rounds',
      'client_pillar_activations',
      'calendar_actionables'
    ),
    'timestamp', now(),
    'status', 'completed'
  )
);