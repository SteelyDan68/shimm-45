-- KRITISK FIX: Skapa user_journey_state för användare som genomfört assessment men saknar journey state
INSERT INTO user_journey_states (
  user_id,
  current_phase,
  completed_assessments,
  journey_progress,
  next_recommended_assessment,
  last_activity_at,
  metadata
)
SELECT DISTINCT
  pa.user_id,
  'ai_analysis_complete' as current_phase,
  jsonb_build_array('welcome', pa.pillar_key) as completed_assessments,
  CASE 
    WHEN COUNT(pa.id) >= 2 THEN 40  -- Flera assessments = högre progress
    ELSE 25  -- En assessment = grundprogress
  END as journey_progress,
  CASE pa.pillar_key
    WHEN 'self_care' THEN 'skills'
    WHEN 'skills' THEN 'talent' 
    ELSE 'self_care'
  END as next_recommended_assessment,
  pa.created_at as last_activity_at,
  jsonb_build_object(
    'welcome_completed_at', MIN(pa.created_at),
    'ai_analysis_completed_at', MAX(pa.created_at),
    'assessment_insights_available', true,
    'latest_assessment_score', MAX(pa.calculated_score),
    'completed_pillars', jsonb_agg(DISTINCT pa.pillar_key)
  ) as metadata
FROM pillar_assessments pa
LEFT JOIN user_journey_states ujs ON pa.user_id = ujs.user_id
WHERE ujs.user_id IS NULL  -- Endast för användare som saknar journey state
  AND pa.user_id = '5489d5a1-79c7-49b0-8ce3-578967d18cf6'  -- Specifik fix för aktuell användare
GROUP BY pa.user_id, pa.pillar_key
ORDER BY pa.user_id;