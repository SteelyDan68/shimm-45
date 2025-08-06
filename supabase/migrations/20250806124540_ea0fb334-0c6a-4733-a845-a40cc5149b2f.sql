-- Fix delete_user_completely function to handle non-existent tables gracefully
CREATE OR REPLACE FUNCTION public.delete_user_completely(user_uuid uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_email text;
  cleanup_count integer;
  result_msg text := '';
  table_exists_check integer;
BEGIN
  -- Hämta användarens e-post först
  SELECT email INTO user_email FROM profiles WHERE id = user_uuid;
  
  IF user_email IS NULL THEN
    RETURN 'User not found in profiles';
  END IF;
  
  RAISE LOG 'Starting complete deletion for user: % (email: %)', user_uuid, user_email;
  
  -- Rensa från tabeller som faktiskt existerar (kontrollera först)
  
  -- 1. Assessment data
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
  
  -- 2. Calendar events
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'calendar_events';
  IF table_exists_check > 0 THEN
    DELETE FROM calendar_events WHERE user_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('calendar_events: %s, ', cleanup_count);
  END IF;
  
  -- 3. Pillar data
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'client_pillar_activations';
  IF table_exists_check > 0 THEN
    DELETE FROM client_pillar_activations WHERE user_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('client_pillar_activations: %s, ', cleanup_count);
  END IF;
  
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'client_pillar_assignments';
  IF table_exists_check > 0 THEN
    DELETE FROM client_pillar_assignments WHERE user_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('client_pillar_assignments: %s, ', cleanup_count);
  END IF;
  
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'pillar_assessments';
  IF table_exists_check > 0 THEN
    DELETE FROM pillar_assessments WHERE user_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('pillar_assessments: %s, ', cleanup_count);
  END IF;
  
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'pillar_visualization_data';
  IF table_exists_check > 0 THEN
    DELETE FROM pillar_visualization_data WHERE user_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('pillar_visualization_data: %s, ', cleanup_count);
  END IF;
  
  -- 4. GDPR data
  DELETE FROM data_deletion_requests WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('data_deletion_requests: %s, ', cleanup_count);
  
  DELETE FROM data_export_requests WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('data_export_requests: %s, ', cleanup_count);
  
  DELETE FROM gdpr_audit_log WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('gdpr_audit_log: %s, ', cleanup_count);
  
  DELETE FROM user_consent_records WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('user_consent_records: %s, ', cleanup_count);
  
  -- 5. Messages - check if table exists first
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public';
  IF table_exists_check > 0 THEN
    DELETE FROM messages WHERE sender_id = user_uuid OR receiver_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('messages: %s, ', cleanup_count);
  ELSE
    result_msg := result_msg || 'messages: skipped (table not found), ';
  END IF;
  
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'message_preferences';
  IF table_exists_check > 0 THEN
    DELETE FROM message_preferences WHERE user_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('message_preferences: %s, ', cleanup_count);
  END IF;
  
  -- 6. Organization data
  DELETE FROM organization_members WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('organization_members: %s, ', cleanup_count);
  
  -- 7. Path and task data
  DELETE FROM tasks WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('tasks: %s, ', cleanup_count);
  
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'path_entries';
  IF table_exists_check > 0 THEN
    DELETE FROM path_entries WHERE user_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('path_entries: %s, ', cleanup_count);
  END IF;
  
  -- 8. Stefan interactions
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'stefan_interactions';
  IF table_exists_check > 0 THEN
    DELETE FROM stefan_interactions WHERE user_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('stefan_interactions: %s, ', cleanup_count);
  END IF;
  
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'training_data_stefan';
  IF table_exists_check > 0 THEN
    DELETE FROM training_data_stefan WHERE user_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('training_data_stefan: %s, ', cleanup_count);
  END IF;
  
  -- 9. User state data
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'user_journey_states';
  IF table_exists_check > 0 THEN
    DELETE FROM user_journey_states WHERE user_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('user_journey_states: %s, ', cleanup_count);
  END IF;
  
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'user_relationships';
  IF table_exists_check > 0 THEN
    DELETE FROM user_relationships WHERE coach_id = user_uuid OR client_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('user_relationships: %s, ', cleanup_count);
  END IF;
  
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'welcome_assessments';
  IF table_exists_check > 0 THEN
    DELETE FROM welcome_assessments WHERE user_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('welcome_assessments: %s, ', cleanup_count);
  END IF;
  
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'weekly_email_logs';
  IF table_exists_check > 0 THEN
    DELETE FROM weekly_email_logs WHERE client_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('weekly_email_logs: %s, ', cleanup_count);
  END IF;
  
  -- 10. AI coaching data
  DELETE FROM ai_coaching_recommendations WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('ai_coaching_recommendations: %s, ', cleanup_count);
  
  DELETE FROM coaching_progress_entries WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('coaching_progress_entries: %s, ', cleanup_count);
  
  DELETE FROM coaching_sessions WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('coaching_sessions: %s, ', cleanup_count);
  
  DELETE FROM coach_client_assignments WHERE coach_id = user_uuid OR client_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('coach_client_assignments: %s, ', cleanup_count);
  
  -- 11. User attributes
  DELETE FROM user_attributes WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('user_attributes: %s, ', cleanup_count);
  
  -- 12. Roller (viktigt att göra innan profiles)
  DELETE FROM user_roles WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('user_roles: %s, ', cleanup_count);
  
  -- 13. Inbjudningar relaterade till e-post
  DELETE FROM invitations WHERE email = user_email;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('invitations: %s, ', cleanup_count);
  
  -- 14. GDPR requests
  DELETE FROM gdpr_requests WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('gdpr_requests: %s, ', cleanup_count);
  
  -- 15. Till sist, profiles
  DELETE FROM profiles WHERE id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('profiles: %s', cleanup_count);
  
  RAISE LOG 'Complete deletion finished for user: % - %', user_uuid, result_msg;
  
  RETURN format('User %s (%s) deleted completely. Cleaned tables: %s', user_uuid, user_email, result_msg);
END;
$function$