-- ================================================
-- ENTERPRISE OPEN_TRACK INTEGRATION - FINAL VERSION
-- ================================================

-- 1. FIX ASSESSMENT_ROUNDS CONSTRAINT (ABSOLUT KRITISK!)
ALTER TABLE assessment_rounds 
DROP CONSTRAINT IF EXISTS assessment_rounds_pillar_type_check;

ALTER TABLE assessment_rounds 
ADD CONSTRAINT assessment_rounds_pillar_type_check 
CHECK (pillar_type = ANY (ARRAY['self_care'::text, 'skills'::text, 'talent'::text, 'brand'::text, 'economy'::text, 'open_track'::text]));

-- 2. CHECK IF OPEN_TRACK TEMPLATE EXISTS, INSERT IF NOT
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM assessment_templates WHERE pillar_key = 'open_track') THEN
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
  END IF;
END $$;

-- 3. CREATE ASSESSMENT FOR ANNA IF NOT EXISTS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM assessment_rounds 
    WHERE user_id = '3724384a-a36a-436f-b888-0b782652ba2a' 
    AND pillar_type = 'open_track'
  ) THEN
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
  END IF;
END $$;

-- 4. CREATE PERFORMANCE INDEX
CREATE INDEX IF NOT EXISTS idx_assessment_rounds_open_track 
ON assessment_rounds (user_id, pillar_type) 
WHERE pillar_type = 'open_track';