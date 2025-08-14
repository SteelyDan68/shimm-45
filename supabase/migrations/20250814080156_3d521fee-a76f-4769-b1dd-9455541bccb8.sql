-- KRITISK FIX: Utöka total_pillar_reset funktionen för att verkligen rensa ALLT
CREATE OR REPLACE FUNCTION public.total_pillar_reset(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  deleted_assessments integer := 0;
  deleted_strategies integer := 0;
  deleted_actionables integer := 0;
  deleted_path_entries integer := 0;
  deleted_analyses integer := 0;
  deleted_mappings integer := 0;
  deleted_milestones integer := 0;
  deleted_calendar_events integer := 0;
  deleted_tasks integer := 0;
  deleted_analytics integer := 0;
  deleted_coaching_sessions integer := 0;
  deleted_coaching_plans integer := 0;
  result jsonb;
BEGIN
  RAISE LOG 'Starting CRITICAL TOTAL RESET for user %', p_user_id;

  -- 1. Delete ALL assessment rounds (KRITISK - dashboard källa)
  DELETE FROM assessment_rounds WHERE user_id = p_user_id;
  GET DIAGNOSTICS deleted_assessments = ROW_COUNT;

  -- 2. Delete ALL development strategies
  BEGIN
    DELETE FROM development_strategies WHERE user_id = p_user_id;
    GET DIAGNOSTICS deleted_strategies = ROW_COUNT;
  EXCEPTION 
    WHEN undefined_table THEN 
      deleted_strategies := 0;
  END;

  -- 3. Delete ALL calendar actionables
  DELETE FROM calendar_actionables WHERE user_id = p_user_id;
  GET DIAGNOSTICS deleted_actionables = ROW_COUNT;

  -- 4. Delete ALL path entries
  DELETE FROM path_entries WHERE user_id = p_user_id;
  GET DIAGNOSTICS deleted_path_entries = ROW_COUNT;

  -- 5. Delete ALL detailed analyses
  DELETE FROM assessment_detailed_analyses WHERE user_id = p_user_id;
  GET DIAGNOSTICS deleted_analyses = ROW_COUNT;

  -- 6. Delete ALL assessment mappings
  DELETE FROM assessment_actionable_mappings WHERE user_id = p_user_id;
  GET DIAGNOSTICS deleted_mappings = ROW_COUNT;

  -- 7. Delete ALL coaching milestones
  BEGIN
    DELETE FROM coaching_milestones 
    WHERE plan_id IN (
      SELECT id FROM coaching_plans WHERE user_id = p_user_id
    );
    GET DIAGNOSTICS deleted_milestones = ROW_COUNT;
  EXCEPTION 
    WHEN undefined_table THEN 
      deleted_milestones := 0;
  END;

  -- 8. Delete ALL calendar events
  DELETE FROM calendar_events WHERE user_id = p_user_id;
  GET DIAGNOSTICS deleted_calendar_events = ROW_COUNT;

  -- 9. Delete ALL AI coaching sessions
  DELETE FROM ai_coaching_sessions WHERE user_id = p_user_id;
  GET DIAGNOSTICS deleted_coaching_sessions = ROW_COUNT;

  -- 10. Delete ALL coaching plans
  BEGIN
    DELETE FROM coaching_plans WHERE user_id = p_user_id;
    GET DIAGNOSTICS deleted_coaching_plans = ROW_COUNT;
  EXCEPTION 
    WHEN undefined_table THEN 
      deleted_coaching_plans := 0;
  END;

  -- 11. Delete ALL analytics metrics
  DELETE FROM analytics_metrics WHERE user_id = p_user_id;
  GET DIAGNOSTICS deleted_analytics = ROW_COUNT;

  -- 12. Reset user journey state
  BEGIN
    UPDATE user_journey_states 
    SET 
      current_phase = 'welcome',
      completed_assessments = '[]'::jsonb,
      journey_progress = 0,
      next_recommended_assessment = null,
      metadata = '{}'::jsonb,
      updated_at = now()
    WHERE user_id = p_user_id;
  EXCEPTION 
    WHEN undefined_table THEN 
      NULL;
  END;

  result := jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'reset_type', 'KRITISK_TOTAL_SYSTEM_RESET',
    'cleanup_summary', jsonb_build_object(
      'deleted_assessments', deleted_assessments,
      'deleted_strategies', deleted_strategies,
      'deleted_actionables', deleted_actionables,
      'deleted_path_entries', deleted_path_entries,
      'deleted_analyses', deleted_analyses,
      'deleted_mappings', deleted_mappings,
      'deleted_milestones', deleted_milestones,
      'deleted_calendar_events', deleted_calendar_events,
      'deleted_coaching_sessions', deleted_coaching_sessions,
      'deleted_coaching_plans', deleted_coaching_plans,
      'deleted_analytics', deleted_analytics
    ),
    'message', 'KRITISK TOTAL RESET genomförd. ALL användardata raderad permanent.',
    'timestamp', now()
  );

  RAISE LOG 'KRITISK TOTAL RESET completed: %', result;
  RETURN result;
END;
$function$;