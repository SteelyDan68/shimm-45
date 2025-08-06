-- Fix delete_user_completely function to handle foreign key constraints properly
-- Delete in correct order: child tables first, then parent tables

CREATE OR REPLACE FUNCTION public.delete_user_completely(user_identifier text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_uuid uuid;
  user_email text;
  cleanup_count integer;
  result_msg text := '';
  table_exists_check integer;
  column_exists_check integer;
BEGIN
  -- First, determine if input is UUID or email and get both values
  BEGIN
    -- Try to cast to UUID first
    user_uuid := user_identifier::uuid;
    -- If successful, get email from profiles
    SELECT email INTO user_email FROM profiles WHERE id = user_uuid;
    
    IF user_email IS NULL THEN
      RETURN 'User not found in profiles with ID: ' || user_identifier;
    END IF;
    
    RAISE LOG 'Input was UUID. Found user: % (email: %)', user_uuid, user_email;
    
  EXCEPTION WHEN invalid_text_representation THEN
    -- Input is not a UUID, treat as email
    user_email := user_identifier;
    SELECT id INTO user_uuid FROM profiles WHERE email = user_email;
    
    IF user_uuid IS NULL THEN
      RETURN 'User not found in profiles with email: ' || user_identifier;
    END IF;
    
    RAISE LOG 'Input was email. Found user: % (ID: %)', user_email, user_uuid;
  END;
  
  RAISE LOG 'Starting complete deletion for user: % (email: %)', user_uuid, user_email;
  
  -- DELETE IN CORRECT ORDER TO AVOID FOREIGN KEY VIOLATIONS
  -- Start with child tables that reference other tables
  
  -- 1. Coaching progress entries (references coaching_sessions)
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'coaching_progress_entries';
  IF table_exists_check > 0 THEN
    DELETE FROM coaching_progress_entries WHERE user_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('coaching_progress_entries: %s, ', cleanup_count);
  END IF;
  
  -- 2. AI coaching recommendations (references coaching_sessions)
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'ai_coaching_recommendations';
  IF table_exists_check > 0 THEN
    DELETE FROM ai_coaching_recommendations WHERE user_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('ai_coaching_recommendations: %s, ', cleanup_count);
  END IF;
  
  -- 3. Coaching milestones (references coaching_plans via plan_id)
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'coaching_milestones';
  IF table_exists_check > 0 THEN
    DELETE FROM coaching_milestones WHERE plan_id IN (
      SELECT id FROM coaching_plans WHERE user_id = user_uuid
    );
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('coaching_milestones: %s, ', cleanup_count);
  END IF;
  
  -- 4. Now delete parent coaching tables
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'coaching_sessions';
  IF table_exists_check > 0 THEN
    DELETE FROM coaching_sessions WHERE user_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('coaching_sessions: %s, ', cleanup_count);
  END IF;
  
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'coaching_plans';
  IF table_exists_check > 0 THEN
    DELETE FROM coaching_plans WHERE user_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('coaching_plans: %s, ', cleanup_count);
  END IF;
  
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'coaching_analytics';
  IF table_exists_check > 0 THEN
    DELETE FROM coaching_analytics WHERE user_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('coaching_analytics: %s, ', cleanup_count);
  END IF;
  
  -- 5. Assessment data
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'assessment_form_assignments';
  IF table_exists_check > 0 THEN
    DELETE FROM assessment_form_assignments WHERE user_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('assessment_form_assignments: %s, ', cleanup_count);
  END IF;
  
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'assessment_rounds';
  IF table_exists_check > 0 THEN
    DELETE FROM assessment_rounds WHERE user_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('assessment_rounds: %s, ', cleanup_count);
  END IF;
  
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'assessment_states';
  IF table_exists_check > 0 THEN
    DELETE FROM assessment_states WHERE user_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('assessment_states: %s, ', cleanup_count);
  END IF;
  
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'assessment_events';
  IF table_exists_check > 0 THEN
    DELETE FROM assessment_events WHERE user_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('assessment_events: %s, ', cleanup_count);
  END IF;
  
  -- 6. Calendar events
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'calendar_events';
  IF table_exists_check > 0 THEN
    DELETE FROM calendar_events WHERE user_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('calendar_events: %s, ', cleanup_count);
  END IF;
  
  -- 7. Coach client assignments - check if column exists
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'coach_client_assignments';
  IF table_exists_check > 0 THEN
    SELECT COUNT(*) INTO column_exists_check FROM information_schema.columns 
    WHERE table_name = 'coach_client_assignments' AND column_name = 'coach_id';
    
    IF column_exists_check > 0 THEN
      DELETE FROM coach_client_assignments WHERE coach_id = user_uuid OR client_id = user_uuid;
      GET DIAGNOSTICS cleanup_count = ROW_COUNT;
      result_msg := result_msg || format('coach_client_assignments: %s, ', cleanup_count);
    END IF;
  END IF;
  
  -- 8. Analytics data
  DELETE FROM analytics_events WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('analytics_events: %s, ', cleanup_count);
  
  DELETE FROM analytics_metrics WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('analytics_metrics: %s, ', cleanup_count);
  
  DELETE FROM ai_coaching_analytics WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('ai_coaching_analytics: %s, ', cleanup_count);
  
  -- 9. GDPR and audit data
  DELETE FROM data_deletion_requests WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('data_deletion_requests: %s, ', cleanup_count);
  
  DELETE FROM data_export_requests WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('data_export_requests: %s, ', cleanup_count);
  
  DELETE FROM gdpr_audit_log WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('gdpr_audit_log: %s, ', cleanup_count);
  
  -- 10. User consent records
  DELETE FROM user_consent_records WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('user_consent_records: %s, ', cleanup_count);
  
  -- 11. User roles
  DELETE FROM user_roles WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('user_roles: %s, ', cleanup_count);
  
  -- 12. User attributes
  DELETE FROM user_attributes WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('user_attributes: %s, ', cleanup_count);
  
  -- 13. Notifications and preferences
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'notification_preferences';
  IF table_exists_check > 0 THEN
    DELETE FROM notification_preferences WHERE user_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('notification_preferences: %s, ', cleanup_count);
  END IF;
  
  -- 14. Context insights
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'context_insights';
  IF table_exists_check > 0 THEN
    DELETE FROM context_insights WHERE user_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('context_insights: %s, ', cleanup_count);
  END IF;
  
  -- 15. Finally delete the profile (whether active or inactive)
  DELETE FROM profiles WHERE id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('profiles: %s', cleanup_count);
  
  RAISE LOG 'Complete deletion finished for user: % (email: %) - Results: %', user_uuid, user_email, result_msg;
  
  RETURN format('User %s (%s) completely deleted - Results: %s', user_uuid, user_email, result_msg);
END;
$function$;