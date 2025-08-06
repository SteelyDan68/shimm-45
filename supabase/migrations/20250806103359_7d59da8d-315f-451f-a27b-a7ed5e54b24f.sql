-- Lägg till soft delete kolumn i profiles tabellen
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deactivated_by UUID,
ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;

-- Uppdatera delete_user_completely funktionen att bara hantera existerande tabeller
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
  
  -- 5. Messages
  SELECT COUNT(*) INTO table_exists_check FROM information_schema.tables WHERE table_name = 'message_preferences';
  IF table_exists_check > 0 THEN
    DELETE FROM message_preferences WHERE user_id = user_uuid;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    result_msg := result_msg || format('message_preferences: %s, ', cleanup_count);
  END IF;
  
  DELETE FROM messages WHERE sender_id = user_uuid OR receiver_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('messages: %s, ', cleanup_count);
  
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
  
  -- 14. Till sist, profiles
  DELETE FROM profiles WHERE id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('profiles: %s', cleanup_count);
  
  RAISE LOG 'Complete deletion finished for user: % - %', user_uuid, result_msg;
  
  RETURN format('User %s (%s) deleted completely. Cleaned tables: %s', user_uuid, user_email, result_msg);
END;
$function$;

-- Skapa soft delete funktion
CREATE OR REPLACE FUNCTION public.soft_delete_user(user_uuid uuid, deactivation_reason text DEFAULT 'admin_action')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_email text;
  admin_user_id uuid;
BEGIN
  -- Hämta användarens e-post
  SELECT email INTO user_email FROM profiles WHERE id = user_uuid AND is_active = true;
  
  IF user_email IS NULL THEN
    RETURN 'User not found or already deactivated';
  END IF;
  
  -- Hämta admin som utför åtgärden
  admin_user_id := auth.uid();
  
  RAISE LOG 'Soft deleting user: % (email: %) by admin: %', user_uuid, user_email, admin_user_id;
  
  -- Uppdatera användarens status
  UPDATE profiles 
  SET 
    is_active = false,
    deactivated_at = now(),
    deactivated_by = admin_user_id,
    deactivation_reason = soft_delete_user.deactivation_reason,
    updated_at = now()
  WHERE id = user_uuid;
  
  -- Inaktivera användarens roller
  UPDATE user_roles 
  SET expires_at = now()
  WHERE user_id = user_uuid AND expires_at IS NULL;
  
  -- Logga aktiviteten
  INSERT INTO admin_audit_log (
    admin_user_id,
    action,
    target_user_id,
    details
  ) VALUES (
    admin_user_id,
    'user_soft_delete',
    user_uuid,
    jsonb_build_object(
      'user_email', user_email,
      'reason', deactivation_reason,
      'timestamp', now()
    )
  );
  
  RAISE LOG 'Soft deletion completed for user: %', user_uuid;
  
  RETURN format('User %s (%s) has been deactivated successfully', user_uuid, user_email);
END;
$function$;

-- Skapa funktion för att återaktivera användare
CREATE OR REPLACE FUNCTION public.reactivate_user(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_email text;
  admin_user_id uuid;
BEGIN
  -- Hämta användarens e-post
  SELECT email INTO user_email FROM profiles WHERE id = user_uuid AND is_active = false;
  
  IF user_email IS NULL THEN
    RETURN 'User not found or already active';
  END IF;
  
  -- Hämta admin som utför åtgärden
  admin_user_id := auth.uid();
  
  RAISE LOG 'Reactivating user: % (email: %) by admin: %', user_uuid, user_email, admin_user_id;
  
  -- Återaktivera användaren
  UPDATE profiles 
  SET 
    is_active = true,
    deactivated_at = NULL,
    deactivated_by = NULL,
    deactivation_reason = NULL,
    updated_at = now()
  WHERE id = user_uuid;
  
  -- Logga aktiviteten
  INSERT INTO admin_audit_log (
    admin_user_id,
    action,
    target_user_id,
    details
  ) VALUES (
    admin_user_id,
    'user_reactivation',
    user_uuid,
    jsonb_build_object(
      'user_email', user_email,
      'timestamp', now()
    )
  );
  
  RAISE LOG 'Reactivation completed for user: %', user_uuid;
  
  RETURN format('User %s (%s) has been reactivated successfully', user_uuid, user_email);
END;
$function$;