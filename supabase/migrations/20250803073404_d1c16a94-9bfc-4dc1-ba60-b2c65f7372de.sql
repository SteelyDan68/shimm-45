-- KRITISK FIX: Enklare version - skapa user_journey_state för specifik användare
INSERT INTO user_journey_states (
  user_id,
  current_phase,
  completed_assessments,
  journey_progress,
  next_recommended_assessment,
  last_activity_at,
  metadata
)
VALUES (
  '5489d5a1-79c7-49b0-8ce3-578967d18cf6',
  'ai_analysis_complete',
  '["welcome", "self_care"]'::jsonb,
  25,
  'skills',
  '2025-08-03T07:13:59.507274+00:00'::timestamp with time zone,
  '{
    "welcome_completed_at": "2025-08-03T07:13:59.507274+00:00",
    "ai_analysis_completed_at": "2025-08-03T07:13:59.507274+00:00",
    "assessment_insights_available": true,
    "latest_assessment_score": 65,
    "completed_pillars": ["self_care"]
  }'::jsonb
)
ON CONFLICT (user_id) DO UPDATE SET
  current_phase = 'ai_analysis_complete',
  completed_assessments = '["welcome", "self_care"]'::jsonb,
  journey_progress = 25,
  next_recommended_assessment = 'skills',
  metadata = '{
    "welcome_completed_at": "2025-08-03T07:13:59.507274+00:00",
    "ai_analysis_completed_at": "2025-08-03T07:13:59.507274+00:00",
    "assessment_insights_available": true,
    "latest_assessment_score": 65,
    "completed_pillars": ["self_care"]
  }'::jsonb,
  updated_at = now();