-- ================================================
-- ENTERPRISE CONSTRAINT FIX FÖR OPEN_TRACK INTEGRATION
-- Uppdaterar constraints för existerande tabeller
-- ================================================

-- 1. FIX ASSESSMENT_ROUNDS CONSTRAINT (KRITISK!)
ALTER TABLE assessment_rounds 
DROP CONSTRAINT IF EXISTS assessment_rounds_pillar_type_check;

ALTER TABLE assessment_rounds 
ADD CONSTRAINT assessment_rounds_pillar_type_check 
CHECK (pillar_type = ANY (ARRAY['self_care'::text, 'skills'::text, 'talent'::text, 'brand'::text, 'economy'::text, 'open_track'::text]));

-- 2. ADD ASSESSMENT TEMPLATE FOR OPEN_TRACK
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
) ON CONFLICT (pillar_key) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  scoring_config = EXCLUDED.scoring_config,
  questions = EXCLUDED.questions,
  updated_at = now();

-- 3. CREATE SAMPLE ASSESSMENT FOR ANNA
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
) ON CONFLICT (user_id, pillar_type) DO UPDATE SET
  answers = EXCLUDED.answers,
  scores = EXCLUDED.scores,
  comments = EXCLUDED.comments,
  ai_analysis = EXCLUDED.ai_analysis,
  updated_at = now();

-- 4. CREATE PERFORMANCE INDEX
CREATE INDEX IF NOT EXISTS idx_assessment_rounds_open_track 
ON assessment_rounds (user_id, pillar_type) 
WHERE pillar_type = 'open_track';

-- 5. AUDIT LOG
INSERT INTO admin_audit_log (
  admin_user_id,
  action,
  target_user_id,
  details
) VALUES (
  '3724384a-a36a-436f-b888-0b782652ba2a',
  'open_track_pillar_full_integration',
  '3724384a-a36a-436f-b888-0b782652ba2a',
  jsonb_build_object(
    'migration_type', 'complete_open_track_setup',
    'components_created', jsonb_build_array(
      'assessment_rounds_constraint_fixed',
      'assessment_template_created',
      'sample_assessment_created',
      'performance_index_created'
    ),
    'pillar_type', 'open_track',
    'timestamp', now(),
    'status', 'completed_successfully'
  )
);