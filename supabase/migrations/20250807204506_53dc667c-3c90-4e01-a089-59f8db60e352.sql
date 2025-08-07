-- 🔒 FAS 5: SECURITY WARNINGS CLEANUP
-- Fixar kritiska Security Definer Views och Function Search Path issues

-- 1. FIX SEARCH PATH FÖR KVARSTÅENDE FUNKTIONER
-- Lista av funktioner som behöver search_path fix

CREATE OR REPLACE FUNCTION public.get_user_context(target_user_id uuid)
RETURNS TABLE(user_id uuid, email text, full_name text, roles text[], primary_role text, permission_level integer, can_access boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT 
    p.id as user_id,
    p.email,
    COALESCE(p.first_name || ' ' || p.last_name, p.email) as full_name,
    array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL) as roles,
    CASE 
      WHEN 'client' = ANY(array_agg(ur.role)) THEN 'client'
      WHEN 'coach' = ANY(array_agg(ur.role)) THEN 'coach'  
      WHEN 'admin' = ANY(array_agg(ur.role)) THEN 'admin'
      WHEN 'superadmin' = ANY(array_agg(ur.role)) THEN 'superadmin'
      ELSE 'user'
    END as primary_role,
    CASE 
      WHEN 'superadmin' = ANY(array_agg(ur.role)) THEN 100
      WHEN 'admin' = ANY(array_agg(ur.role)) THEN 80
      WHEN 'coach' = ANY(array_agg(ur.role)) THEN 60
      WHEN 'client' = ANY(array_agg(ur.role)) THEN 40
      ELSE 20
    END as permission_level,
    CASE
      -- Superadmin god mode
      WHEN public.superadmin_god_mode(auth.uid()) THEN true
      -- Self access
      WHEN auth.uid() = target_user_id THEN true
      -- Admin access
      WHEN public.is_admin(auth.uid()) THEN true
      -- Coach access to their clients
      WHEN EXISTS (
        SELECT 1 FROM public.coach_client_assignments cca 
        WHERE cca.coach_id = auth.uid() 
        AND cca.client_id = target_user_id 
        AND cca.is_active = true
      ) THEN true
      ELSE false
    END as can_access
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE p.id = target_user_id
  GROUP BY p.id, p.email, p.first_name, p.last_name, p.avatar_url, p.created_at, p.updated_at;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_roles_and_relationships(target_user_id uuid)
RETURNS TABLE(user_id uuid, roles app_role[], coach_relationships uuid[], client_relationships uuid[])
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT 
    target_user_id as user_id,
    COALESCE(
      array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL), 
      ARRAY[]::app_role[]
    ) as roles,
    COALESCE(
      array_agg(DISTINCT cca_as_coach.client_id) FILTER (WHERE cca_as_coach.client_id IS NOT NULL),
      ARRAY[]::uuid[]
    ) as coach_relationships,
    COALESCE(
      array_agg(DISTINCT cca_as_client.coach_id) FILTER (WHERE cca_as_client.coach_id IS NOT NULL),
      ARRAY[]::uuid[]
    ) as client_relationships
  FROM (SELECT target_user_id) base
  LEFT JOIN public.user_roles ur ON ur.user_id = target_user_id
  LEFT JOIN public.coach_client_assignments cca_as_coach ON cca_as_coach.coach_id = target_user_id AND cca_as_coach.is_active = true
  LEFT JOIN public.coach_client_assignments cca_as_client ON cca_as_client.client_id = target_user_id AND cca_as_client.is_active = true
  GROUP BY target_user_id;
$function$;

CREATE OR REPLACE FUNCTION public.set_invitation_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.token IS NULL OR NEW.token = '' THEN
    NEW.token := public.generate_invitation_token();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_error_severity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Determine severity based on context or message content
  IF NEW.context ILIKE '%critical%' OR NEW.message ILIKE '%critical%' THEN
    NEW.severity = 'critical';
  ELSIF NEW.context ILIKE '%warning%' OR NEW.message ILIKE '%warning%' THEN
    NEW.severity = 'warning';
  ELSE
    NEW.severity = 'error';
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_error_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  DELETE FROM public.error_logs 
  WHERE created_at < now() - interval '90 days'
  AND severity != 'critical'; -- Keep critical errors longer
END;
$function$;

CREATE OR REPLACE FUNCTION public.recover_assessment_draft(p_user_id uuid, p_assessment_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  latest_draft RECORD;
  recovery_data JSONB;
BEGIN
  -- Hitta senaste draft
  SELECT * INTO latest_draft
  FROM public.assessment_states
  WHERE user_id = p_user_id 
    AND assessment_key = p_assessment_key
    AND is_draft = true
  ORDER BY last_saved_at DESC
  LIMIT 1;

  IF latest_draft IS NULL THEN
    RETURN jsonb_build_object(
      'recovered', false,
      'message', 'No draft found'
    );
  END IF;

  -- Bygg recovery data
  recovery_data := jsonb_build_object(
    'recovered', true,
    'form_data', latest_draft.form_data,
    'metadata', latest_draft.metadata,
    'last_saved_at', latest_draft.last_saved_at,
    'version', latest_draft.version,
    'auto_save_count', latest_draft.auto_save_count
  );

  RETURN recovery_data;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_attribute(_user_id uuid, _attribute_key text)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT attribute_value 
  FROM public.user_attributes 
  WHERE user_id = _user_id 
    AND attribute_key = _attribute_key 
    AND is_active = true;
$function$;

CREATE OR REPLACE FUNCTION public.set_user_attribute(_user_id uuid, _attribute_key text, _attribute_value jsonb, _attribute_type text DEFAULT 'property'::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.user_attributes (
    user_id, 
    attribute_key, 
    attribute_value, 
    attribute_type,
    created_by
  )
  VALUES (
    _user_id, 
    _attribute_key, 
    _attribute_value, 
    _attribute_type,
    auth.uid()
  )
  ON CONFLICT (user_id, attribute_key) 
  DO UPDATE SET 
    attribute_value = _attribute_value,
    attribute_type = _attribute_type,
    updated_at = now(),
    is_active = true;
END;
$function$;