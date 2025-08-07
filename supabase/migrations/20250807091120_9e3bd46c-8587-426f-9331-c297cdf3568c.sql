-- Migrera Annas data med korrekt NULL-hantering
-- Använd fallback-data där assessment_data saknas

INSERT INTO assessment_rounds (
  user_id, 
  created_by,
  pillar_type,
  answers,
  scores,
  comments,
  ai_analysis,
  created_at,
  updated_at
)
SELECT 
  '3724384a-a36a-436f-b888-0b782652ba2a'::uuid as user_id,
  '3724384a-a36a-436f-b888-0b782652ba2a'::uuid as created_by,
  (metadata->>'pillar_type')::text as pillar_type,
  -- Fallback för answers om assessment_data saknas
  COALESCE(
    (metadata->'assessment_data')::jsonb,
    jsonb_build_object('reconstructed_from_analysis', true)
  ) as answers,
  jsonb_build_object(
    (metadata->>'pillar_type'), (metadata->>'assessment_score')::numeric,
    'overall', (metadata->>'assessment_score')::numeric
  ) as scores,
  'Migrerad från path_entries' as comments,
  details as ai_analysis,
  created_at,
  updated_at
FROM path_entries 
WHERE user_id = '3724384a-a36a-436f-b888-0b782652ba2a'
  AND type = 'recommendation'
  AND ai_generated = true
  AND details IS NOT NULL
  AND length(details) > 100  -- Säkerställ att det är en riktig analys
  AND metadata->>'pillar_type' IS NOT NULL
  AND metadata->>'assessment_score' IS NOT NULL
  -- Undvik dubbletter
  AND NOT EXISTS (
    SELECT 1 FROM assessment_rounds ar 
    WHERE ar.user_id = '3724384a-a36a-436f-b888-0b782652ba2a' 
    AND ar.pillar_type = (path_entries.metadata->>'pillar_type')
  );