-- First drop the existing function then recreate it with proper return type
DROP FUNCTION IF EXISTS public.cleanup_pillar_assessments_on_retake(uuid, text);

-- Create comprehensive cleanup function for pillar retakes that handles complete system integrity
CREATE OR REPLACE FUNCTION public.cleanup_pillar_assessments_on_retake(
  p_user_id uuid,
  p_pillar_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_assessments integer := 0;
  deleted_strategies integer := 0;
  deleted_actionables integer := 0;
  deleted_path_entries integer := 0;
  deleted_analyses integer := 0;
  deleted_mappings integer := 0;
  deleted_milestones integer := 0;
  result jsonb;
BEGIN
  RAISE LOG 'Starting comprehensive pillar cleanup for user % pillar %', p_user_id, p_pillar_type;

  -- 1. Delete assessment rounds for this pillar
  DELETE FROM assessment_rounds 
  WHERE user_id = p_user_id AND pillar_type = p_pillar_type;
  GET DIAGNOSTICS deleted_assessments = ROW_COUNT;

  -- 2. Delete development strategies for this pillar (if table exists)
  BEGIN
    DELETE FROM development_strategies 
    WHERE user_id = p_user_id AND pillar_key = p_pillar_type;
    GET DIAGNOSTICS deleted_strategies = ROW_COUNT;
  EXCEPTION 
    WHEN undefined_table THEN 
      deleted_strategies := 0;
  END;

  -- 3. Delete calendar actionables for this pillar
  DELETE FROM calendar_actionables 
  WHERE user_id = p_user_id AND pillar_key = p_pillar_type;
  GET DIAGNOSTICS deleted_actionables = ROW_COUNT;

  -- 4. Delete path entries for this pillar
  DELETE FROM path_entries 
  WHERE user_id = p_user_id AND (metadata->>'pillar_type')::text = p_pillar_type;
  GET DIAGNOSTICS deleted_path_entries = ROW_COUNT;

  -- 5. Delete detailed analyses for this pillar
  DELETE FROM assessment_detailed_analyses 
  WHERE user_id = p_user_id AND pillar_type = p_pillar_type;
  GET DIAGNOSTICS deleted_analyses = ROW_COUNT;

  -- 6. Delete assessment actionable mappings for this pillar
  DELETE FROM assessment_actionable_mappings 
  WHERE user_id = p_user_id;
  GET DIAGNOSTICS deleted_mappings = ROW_COUNT;

  -- 7. Delete coaching milestones related to this pillar's plans (if table exists)
  BEGIN
    DELETE FROM coaching_milestones 
    WHERE plan_id IN (
      SELECT id FROM coaching_plans 
      WHERE user_id = p_user_id 
        AND focus_areas::jsonb ? p_pillar_type
    );
    GET DIAGNOSTICS deleted_milestones = ROW_COUNT;
  EXCEPTION 
    WHEN undefined_table THEN 
      deleted_milestones := 0;
  END;

  -- 8. Update coaching plans to remove this pillar from focus areas (if table exists)
  BEGIN
    UPDATE coaching_plans 
    SET focus_areas = (
      SELECT jsonb_agg(area) 
      FROM jsonb_array_elements_text(focus_areas) area 
      WHERE area != p_pillar_type
    )
    WHERE user_id = p_user_id 
      AND focus_areas::jsonb ? p_pillar_type;
  EXCEPTION 
    WHEN undefined_table THEN 
      -- Table doesn't exist, skip
      NULL;
  END;

  -- 9. Deactivate pillar in path_entries to reset activation state
  INSERT INTO path_entries (
    user_id,
    type,
    pillar_type,
    metadata,
    details,
    ai_generated
  ) VALUES (
    p_user_id,
    'deactivation',
    p_pillar_type,
    jsonb_build_object(
      'reason', 'retake_initiated',
      'timestamp', now()
    ),
    'Pillar deactivated for retake',
    true
  );

  result := jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'pillar_type', p_pillar_type,
    'cleanup_summary', jsonb_build_object(
      'deleted_assessments', deleted_assessments,
      'deleted_strategies', deleted_strategies,
      'deleted_actionables', deleted_actionables,
      'deleted_path_entries', deleted_path_entries,
      'deleted_analyses', deleted_analyses,
      'deleted_mappings', deleted_mappings,
      'deleted_milestones', deleted_milestones
    ),
    'message', format('Comprehensive cleanup completed for %s. Ready for fresh pillar assessment.', p_pillar_type),
    'timestamp', now()
  );

  RAISE LOG 'Cleanup completed: %', result;
  RETURN result;
END;
$$;