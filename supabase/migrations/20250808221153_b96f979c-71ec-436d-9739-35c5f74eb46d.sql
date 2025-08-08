-- SECURITY FIXES - Phase 1: Continued (avoiding duplicates)
-- Fix remaining search_path issues for existing functions

-- Update remaining functions with search_path
CREATE OR REPLACE FUNCTION public.get_user_roles_and_relationships(target_user_id uuid)
RETURNS TABLE(user_id uuid, roles app_role[], coach_relationships uuid[], client_relationships uuid[])
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.user_has_any_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.has_user_attribute(_user_id uuid, _attribute_key text, _attribute_value jsonb DEFAULT NULL::jsonb)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_attributes 
    WHERE user_id = _user_id 
      AND attribute_key = _attribute_key 
      AND is_active = true
      AND (
        _attribute_value IS NULL 
        OR attribute_value = _attribute_value
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_coach_of_client(_coach_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM coach_client_assignments 
    WHERE coach_id = _coach_id 
    AND client_id = _client_id 
    AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_client_context(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT (
    -- User has client role
    public.has_role(_user_id, 'client') OR
    -- User has client attribute
    public.has_user_attribute(_user_id, 'context', '"client"'::jsonb)
  );
$$;

-- Enhanced rate limiting function with better security
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  identifier text,
  max_attempts integer DEFAULT 5,
  window_minutes integer DEFAULT 15
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_attempts integer;
  window_start timestamp with time zone;
  result jsonb;
BEGIN
  window_start := now() - (window_minutes || ' minutes')::interval;
  
  -- Count attempts in current window
  SELECT COUNT(*)
  INTO current_attempts
  FROM public.admin_audit_log
  WHERE details->>'identifier' = identifier
    AND timestamp >= window_start;
  
  IF current_attempts >= max_attempts THEN
    -- Log rate limit violation
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action,
      details
    ) VALUES (
      auth.uid(),
      'rate_limit_exceeded',
      jsonb_build_object(
        'identifier', identifier,
        'attempts', current_attempts,
        'max_attempts', max_attempts,
        'window_minutes', window_minutes,
        'timestamp', now()
      )
    );
    
    result := jsonb_build_object(
      'allowed', false,
      'attempts', current_attempts,
      'max_attempts', max_attempts,
      'reset_time', window_start + (window_minutes || ' minutes')::interval
    );
  ELSE
    result := jsonb_build_object(
      'allowed', true,
      'attempts', current_attempts,
      'remaining', max_attempts - current_attempts
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Function to validate and sanitize user input
CREATE OR REPLACE FUNCTION public.validate_and_sanitize_input(
  input_text text,
  max_length integer DEFAULT 1000,
  allow_html boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  sanitized_text text;
  is_valid boolean := true;
  errors text[] := ARRAY[]::text[];
BEGIN
  -- Length validation
  IF length(input_text) > max_length THEN
    errors := array_append(errors, format('Input exceeds maximum length of %s characters', max_length));
    is_valid := false;
  END IF;
  
  -- Basic sanitization
  sanitized_text := input_text;
  
  -- Remove null bytes and control characters
  sanitized_text := regexp_replace(sanitized_text, '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', 'g');
  
  -- HTML sanitization if not allowed
  IF NOT allow_html THEN
    sanitized_text := regexp_replace(sanitized_text, '<[^>]*>', '', 'g');
    sanitized_text := replace(sanitized_text, '&lt;', '<');
    sanitized_text := replace(sanitized_text, '&gt;', '>');
    sanitized_text := replace(sanitized_text, '&amp;', '&');
  END IF;
  
  -- Check for potential SQL injection patterns
  IF sanitized_text ~* '(union|select|insert|update|delete|drop|create|alter|exec|execute)' THEN
    errors := array_append(errors, 'Input contains potentially dangerous content');
    is_valid := false;
  END IF;
  
  RETURN jsonb_build_object(
    'is_valid', is_valid,
    'sanitized_text', sanitized_text,
    'errors', errors,
    'original_length', length(input_text),
    'sanitized_length', length(sanitized_text)
  );
END;
$$;