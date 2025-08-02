-- Temporary function to reset user journey for debugging
-- This will allow the welcome assessment to be redone

CREATE OR REPLACE FUNCTION public.reset_user_welcome_assessment(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result_msg text := '';
BEGIN
  -- Only allow users to reset their own assessment
  IF _user_id != auth.uid() THEN
    RETURN 'Access denied: Can only reset your own assessment';
  END IF;
  
  -- Delete welcome assessments for this user
  DELETE FROM welcome_assessments WHERE user_id = _user_id;
  
  -- Reset user journey state to allow welcome assessment again
  UPDATE user_journey_states 
  SET 
    current_phase = 'welcome',
    completed_assessments = '[]'::jsonb,
    journey_progress = 0,
    next_recommended_assessment = null,
    metadata = '{}'::jsonb,
    updated_at = now()
  WHERE user_id = _user_id;
  
  -- If no journey state exists, create one
  INSERT INTO user_journey_states (
    user_id,
    current_phase,
    completed_assessments,
    journey_progress,
    last_activity_at,
    metadata
  )
  VALUES (
    _user_id,
    'welcome',
    '[]'::jsonb,
    0,
    now(),
    '{}'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  result_msg := 'Welcome assessment reset completed for user: ' || _user_id;
  
  RETURN result_msg;
END;
$$;