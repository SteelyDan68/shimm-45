-- 🔄 TOTAL PILLAR RESET FUNCTION
-- Implementerar komplett systemrengöring för total pillar-reset

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
  result jsonb;
BEGIN
  RAISE LOG 'Starting TOTAL pillar reset for user %', p_user_id;

  -- 1. Delete ALL assessment rounds
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

  -- 9. Delete ALL tasks/actionables
  BEGIN
    DELETE FROM tasks WHERE user_id = p_user_id;
    GET DIAGNOSTICS deleted_tasks = ROW_COUNT;
  EXCEPTION 
    WHEN undefined_table THEN 
      deleted_tasks := 0;
  END;

  -- 10. Delete ALL analytics metrics
  DELETE FROM analytics_metrics WHERE user_id = p_user_id;
  GET DIAGNOSTICS deleted_analytics = ROW_COUNT;

  -- 11. Reset ALL coaching plans
  BEGIN
    UPDATE coaching_plans 
    SET focus_areas = '[]'::jsonb
    WHERE user_id = p_user_id;
  EXCEPTION 
    WHEN undefined_table THEN 
      NULL;
  END;

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
    'reset_type', 'TOTAL_SYSTEM_RESET',
    'cleanup_summary', jsonb_build_object(
      'deleted_assessments', deleted_assessments,
      'deleted_strategies', deleted_strategies,
      'deleted_actionables', deleted_actionables,
      'deleted_path_entries', deleted_path_entries,
      'deleted_analyses', deleted_analyses,
      'deleted_mappings', deleted_mappings,
      'deleted_milestones', deleted_milestones,
      'deleted_calendar_events', deleted_calendar_events,
      'deleted_tasks', deleted_tasks,
      'deleted_analytics', deleted_analytics
    ),
    'message', 'KOMPLETT SYSTEMRESET genomfört. All utvecklingsdata raderad. Användaren kan börja om från början.',
    'timestamp', now()
  );

  -- Log the massive reset operation
  INSERT INTO admin_audit_log (
    admin_user_id,
    action,
    target_user_id,
    details
  ) VALUES (
    p_user_id,
    'total_pillar_system_reset',
    p_user_id,
    result
  );

  RAISE LOG 'TOTAL RESET completed: %', result;
  RETURN result;
END;
$function$;