-- Migrera Annas befintliga assessment data från path_entries till assessment_rounds
-- Detta åtgärdar datafragmenteringen som uppstod när buggfixen gjordes efter hennes assessment

INSERT INTO assessment_rounds (
  id,
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
  gen_random_uuid(),
  '3724384a-a36a-436f-b888-0b782652ba2a'::uuid as user_id,
  '3724384a-a36a-436f-b888-0b782652ba2a'::uuid as created_by,
  (metadata->>'pillar_type')::text as pillar_type,
  (metadata->'assessment_data')::jsonb as answers,
  jsonb_build_object(
    (metadata->>'pillar_type'), (metadata->>'assessment_score')::numeric,
    'overall', (metadata->>'assessment_score')::numeric
  ) as scores,
  '' as comments,
  details as ai_analysis,
  created_at,
  updated_at
FROM path_entries 
WHERE user_id = '3724384a-a36a-436f-b888-0b782652ba2a'
  AND type = 'recommendation'
  AND ai_generated = true
  AND details IS NOT NULL
  AND details != ''
  AND metadata->>'pillar_type' IS NOT NULL
  AND metadata->>'assessment_score' IS NOT NULL
  -- Undvik dubbletter
  AND NOT EXISTS (
    SELECT 1 FROM assessment_rounds ar 
    WHERE ar.user_id = '3724384a-a36a-436f-b888-0b782652ba2a' 
    AND ar.pillar_type = (path_entries.metadata->>'pillar_type')
  );

-- Logga migrering
INSERT INTO admin_audit_log (
  admin_user_id,
  action,
  target_user_id,
  details
) VALUES (
  '3724384a-a36a-436f-b888-0b782652ba2a',
  'data_migration_assessment_rounds',
  '3724384a-a36a-436f-b888-0b782652ba2a',
  jsonb_build_object(
    'reason', 'Fix datafragmentering efter buggfix',
    'migrated_from', 'path_entries', 
    'migrated_to', 'assessment_rounds',
    'timestamp', now()
  )
);