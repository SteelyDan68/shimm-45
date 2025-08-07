-- =====================================================
-- 🔄 RETAKE SYSTEM REDESIGN - FIXED VERSION
-- =====================================================

-- Create function to clean up old assessments during retake
CREATE OR REPLACE FUNCTION public.cleanup_pillar_assessments_on_retake(
  p_user_id UUID,
  p_pillar_type TEXT
) RETURNS TABLE(cleaned_count INTEGER, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  old_count INTEGER;
  path_count INTEGER;
  recommendation_count INTEGER;
BEGIN
  -- Log the cleanup operation
  RAISE LOG 'Starting cleanup for user % pillar %', p_user_id, p_pillar_type;
  
  -- Count existing assessment_rounds for this pillar
  SELECT COUNT(*) INTO old_count
  FROM assessment_rounds 
  WHERE user_id = p_user_id AND pillar_type = p_pillar_type;
  
  -- Count related path_entries
  SELECT COUNT(*) INTO path_count
  FROM path_entries 
  WHERE user_id = p_user_id 
    AND type = 'recommendation' 
    AND (metadata->>'pillar_type')::text = p_pillar_type;
  
  -- Count related recommendations
  SELECT COUNT(*) INTO recommendation_count
  FROM ai_coaching_recommendations 
  WHERE user_id = p_user_id 
    AND (dependencies::text LIKE '%' || p_pillar_type || '%'
         OR resources::text LIKE '%' || p_pillar_type || '%');
  
  -- Delete old assessment_rounds for this pillar
  DELETE FROM assessment_rounds 
  WHERE user_id = p_user_id AND pillar_type = p_pillar_type;
  
  -- Delete related path_entries
  DELETE FROM path_entries 
  WHERE user_id = p_user_id 
    AND type = 'recommendation' 
    AND (metadata->>'pillar_type')::text = p_pillar_type;
  
  -- Update related recommendations to mark as superseded
  UPDATE ai_coaching_recommendations 
  SET 
    status = 'superseded',
    ai_adaptation_notes = 'Superseded by pillar retake: ' || p_pillar_type,
    updated_at = now()
  WHERE user_id = p_user_id 
    AND status NOT IN ('superseded', 'completed')
    AND (dependencies::text LIKE '%' || p_pillar_type || '%'
         OR resources::text LIKE '%' || p_pillar_type || '%');
  
  -- Create audit log entry
  INSERT INTO admin_audit_log (
    admin_user_id,
    action,
    target_user_id,
    details
  ) VALUES (
    COALESCE(auth.uid(), p_user_id),
    'pillar_retake_cleanup',
    p_user_id,
    jsonb_build_object(
      'pillar_type', p_pillar_type,
      'assessment_rounds_removed', old_count,
      'path_entries_removed', path_count,
      'recommendations_superseded', recommendation_count,
      'cleanup_timestamp', now()
    )
  );
  
  RETURN QUERY SELECT 
    old_count + path_count as cleaned_count,
    format('Cleaned %s assessment_rounds, %s path_entries, %s recommendations for %s', 
           old_count, path_count, recommendation_count, p_pillar_type) as message;
END;
$$;

-- Create trigger to prevent duplicate assessments
CREATE OR REPLACE FUNCTION public.prevent_duplicate_assessments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_count INTEGER;
BEGIN
  -- Check for existing assessments for this user/pillar combination
  SELECT COUNT(*) INTO existing_count
  FROM assessment_rounds 
  WHERE user_id = NEW.user_id 
    AND pillar_type = NEW.pillar_type 
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  IF existing_count > 0 THEN
    RAISE LOG 'Preventing duplicate assessment: user=% pillar=% (% existing)', 
              NEW.user_id, NEW.pillar_type, existing_count;
    
    -- Log this attempt
    INSERT INTO admin_audit_log (
      admin_user_id,
      action,
      target_user_id,
      details
    ) VALUES (
      auth.uid(),
      'duplicate_assessment_prevented',
      NEW.user_id,
      jsonb_build_object(
        'pillar_type', NEW.pillar_type,
        'existing_assessments', existing_count,
        'attempted_at', now()
      )
    );
    
    RAISE EXCEPTION 'Duplicate assessment detected for user % pillar %. Use retake functionality to replace existing assessment.', 
                    NEW.user_id, NEW.pillar_type;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply the trigger to assessment_rounds
DROP TRIGGER IF EXISTS prevent_duplicate_assessments_trigger ON assessment_rounds;
CREATE TRIGGER prevent_duplicate_assessments_trigger
  BEFORE INSERT OR UPDATE ON assessment_rounds
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_assessments();

-- Clean up Anna's duplicate self_care assessments immediately (FIXED)
DO $$
DECLARE
  anna_user_id UUID;
  duplicate_count INTEGER;
BEGIN
  -- Get Anna's user_id
  SELECT id INTO anna_user_id 
  FROM profiles 
  WHERE email LIKE '%anna%' 
  LIMIT 1;
  
  IF anna_user_id IS NULL THEN
    RAISE LOG 'Anna not found in profiles';
    RETURN;
  END IF;
  
  -- Count current duplicates
  SELECT COUNT(*) INTO duplicate_count
  FROM assessment_rounds 
  WHERE user_id = anna_user_id AND pillar_type = 'self_care';
  
  RAISE LOG 'Found % self_care assessments for Anna (user_id: %)', duplicate_count, anna_user_id;
  
  -- Keep only the latest assessment, remove older ones
  DELETE FROM assessment_rounds 
  WHERE user_id = anna_user_id 
    AND pillar_type = 'self_care'
    AND created_at < (
      SELECT MAX(ar2.created_at) 
      FROM assessment_rounds ar2 
      WHERE ar2.user_id = anna_user_id 
        AND ar2.pillar_type = 'self_care'
    );
  
  RAISE LOG 'Anna self_care cleanup completed - kept latest assessment only';
END;
$$;