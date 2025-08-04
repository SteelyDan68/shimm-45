-- SECURITY FIX: Add missing SET search_path to remaining security definer functions

-- Fix delete_user_completely function
CREATE OR REPLACE FUNCTION public.delete_user_completely(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_email text;
  cleanup_count integer;
  result_msg text := '';
BEGIN
  -- Hämta användarens e-post först
  SELECT email INTO user_email FROM profiles WHERE id = user_uuid;
  
  IF user_email IS NULL THEN
    RETURN 'User not found in profiles';
  END IF;
  
  RAISE LOG 'Starting complete deletion for user: % (email: %)', user_uuid, user_email;
  
  -- Rensa från alla tabeller i rätt ordning (respektera foreign keys)
  
  -- 1. Assessment data
  DELETE FROM assessment_form_assignments WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('assessment_form_assignments: %s, ', cleanup_count);
  
  DELETE FROM assessment_rounds WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('assessment_rounds: %s, ', cleanup_count);
  
  -- 2. Calendar events
  DELETE FROM calendar_events WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('calendar_events: %s, ', cleanup_count);
  
  -- 3. Client data
  DELETE FROM client_data_cache WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('client_data_cache: %s, ', cleanup_count);
  
  DELETE FROM client_data_containers WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('client_data_containers: %s, ', cleanup_count);
  
  -- 4. Pillar data
  DELETE FROM client_pillar_activations WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('client_pillar_activations: %s, ', cleanup_count);
  
  DELETE FROM client_pillar_assignments WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('client_pillar_assignments: %s, ', cleanup_count);
  
  DELETE FROM pillar_assessments WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('pillar_assessments: %s, ', cleanup_count);
  
  DELETE FROM pillar_visualization_data WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('pillar_visualization_data: %s, ', cleanup_count);
  
  -- 5. GDPR data
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
  
  -- 6. Messages
  DELETE FROM message_preferences WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('message_preferences: %s, ', cleanup_count);
  
  DELETE FROM messages WHERE sender_id = user_uuid OR receiver_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('messages: %s, ', cleanup_count);
  
  -- 7. Organization data
  DELETE FROM organization_members WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('organization_members: %s, ', cleanup_count);
  
  -- 8. Path and task data
  DELETE FROM tasks WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('tasks: %s, ', cleanup_count);
  
  DELETE FROM path_entries WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('path_entries: %s, ', cleanup_count);
  
  -- 9. Stefan interactions
  DELETE FROM stefan_interactions WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('stefan_interactions: %s, ', cleanup_count);
  
  DELETE FROM training_data_stefan WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('training_data_stefan: %s, ', cleanup_count);
  
  -- 10. User state data
  DELETE FROM user_journey_states WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('user_journey_states: %s, ', cleanup_count);
  
  DELETE FROM user_relationships WHERE coach_id = user_uuid OR client_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('user_relationships: %s, ', cleanup_count);
  
  DELETE FROM welcome_assessments WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('welcome_assessments: %s, ', cleanup_count);
  
  DELETE FROM weekly_email_logs WHERE client_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('weekly_email_logs: %s, ', cleanup_count);
  
  -- 11. Roller (viktigt att göra innan profiles)
  DELETE FROM user_roles WHERE user_id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('user_roles: %s, ', cleanup_count);
  
  -- 12. Inbjudningar relaterade till e-post
  DELETE FROM invitations WHERE email = user_email;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('invitations: %s, ', cleanup_count);
  
  -- 13. Till sist, profiles
  DELETE FROM profiles WHERE id = user_uuid;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  result_msg := result_msg || format('profiles: %s', cleanup_count);
  
  RAISE LOG 'Complete deletion finished for user: % - %', user_uuid, result_msg;
  
  RETURN format('User %s (%s) deleted completely. Cleaned tables: %s', user_uuid, user_email, result_msg);
END;
$$;

-- Fix cleanup_user_references function
CREATE OR REPLACE FUNCTION public.cleanup_user_references(target_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  cleanup_count integer := 0;
  result_msg text;
BEGIN
  -- Logga vad som görs
  RAISE LOG 'Starting cleanup for email: %', target_email;
  
  -- Rensa från alla tabeller som kan innehålla e-post eller user_id referenser
  -- (Detta kommer köras innan man försöker skapa en ny användare)
  
  -- Rensa gamla inbjudningar
  DELETE FROM public.invitations WHERE email = target_email;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  RAISE LOG 'Cleaned % invitation records for email: %', cleanup_count, target_email;
  
  -- Rensa profiler som saknar auth.users koppling
  DELETE FROM public.profiles WHERE email = target_email;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  RAISE LOG 'Cleaned % profile records for email: %', cleanup_count, target_email;
  
  -- Sammanställ resultat
  result_msg := 'Cleanup completed for email: ' || target_email;
  RAISE LOG '%', result_msg;
  
  RETURN result_msg;
END;
$$;

-- Fix reset_user_welcome_assessment function
CREATE OR REPLACE FUNCTION public.reset_user_welcome_assessment(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result_msg text := '';
BEGIN
  -- Only allow users to reset their own assessment
  IF _user_id != auth.uid() THEN
    RETURN 'Access denied: Can only reset your own assessment';
  END IF;
  
  -- Delete welcome assessments for this user
  DELETE FROM public.welcome_assessments WHERE user_id = _user_id;
  
  -- Reset user journey state to allow welcome assessment again
  UPDATE public.user_journey_states 
  SET 
    current_phase = 'welcome',
    completed_assessments = '[]'::jsonb,
    journey_progress = 0,
    next_recommended_assessment = null,
    metadata = '{}'::jsonb,
    updated_at = now()
  WHERE user_id = _user_id;
  
  -- If no journey state exists, create one
  INSERT INTO public.user_journey_states (
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

-- Fix aggregate_analytics_data function  
CREATE OR REPLACE FUNCTION public.aggregate_analytics_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Daily aggregation
  INSERT INTO public.analytics_aggregations (date, event_type, user_count, event_count, avg_value, properties)
  SELECT 
    DATE(timestamp) as date,
    event as event_type,
    COUNT(DISTINCT user_id) as user_count,
    COUNT(*) as event_count,
    AVG(CASE 
      WHEN properties->>'response_time_ms' IS NOT NULL 
      THEN (properties->>'response_time_ms')::decimal 
      ELSE NULL 
    END) as avg_value,
    jsonb_build_object(
      'most_common_properties', 
      (SELECT jsonb_agg(DISTINCT key) FROM jsonb_each_text(properties) WHERE key NOT IN ('timestamp', 'response_time_ms'))
    ) as properties
  FROM public.analytics_events 
  WHERE DATE(timestamp) = CURRENT_DATE - INTERVAL '1 day'
  GROUP BY DATE(timestamp), event
  ON CONFLICT (date, event_type) 
  DO UPDATE SET 
    user_count = EXCLUDED.user_count,
    event_count = EXCLUDED.event_count,
    avg_value = EXCLUDED.avg_value,
    properties = EXCLUDED.properties,
    updated_at = now();
END;
$$;

-- Fix insert_analytics_events function
CREATE OR REPLACE FUNCTION public.insert_analytics_events(events_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  event_record jsonb;
BEGIN
  -- Loop through the events array and insert each event
  FOR event_record IN SELECT jsonb_array_elements(events_data)
  LOOP
    INSERT INTO public.analytics_events (
      user_id, 
      session_id, 
      event, 
      properties, 
      timestamp, 
      page_url, 
      user_agent
    ) VALUES (
      (event_record->>'user_id')::uuid,
      event_record->>'session_id',
      event_record->>'event',
      COALESCE(event_record->'properties', '{}'::jsonb),
      (event_record->>'timestamp')::timestamp with time zone,
      event_record->>'page_url',
      event_record->>'user_agent'
    );
  END LOOP;
END;
$$;

-- Fix validate_invitation_token function
CREATE OR REPLACE FUNCTION public.validate_invitation_token(invitation_token text)
RETURNS TABLE(invitation_id uuid, email text, invited_role text, expires_at timestamp with time zone, is_valid boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.email,
    i.invited_role,
    i.expires_at,
    (i.status = 'pending' AND i.expires_at > now()) as is_valid
  FROM public.invitations i
  WHERE i.token = invitation_token;
END;
$$;