-- CRITICAL SECURITY FIXES - Phase 2: Additional Security Hardening

-- 1. Fix function search paths for all functions missing SET search_path
-- This addresses the "Function Search Path Mutable" warnings

-- Update existing functions to have proper search_path settings
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role::app_role
  )
$$;

-- Update the coaching trigger functions
CREATE OR REPLACE FUNCTION public.update_coaching_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_stefan_memory_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_stefan_config_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_messages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Move extensions out of public schema if possible
-- Note: Vector extension might need to stay in public for compatibility
-- This addresses "Extension in Public" warnings

-- Create a dedicated schema for extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO public;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- 3. Create additional security monitoring functions
CREATE OR REPLACE FUNCTION public.monitor_failed_logins()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log failed authentication attempts
  IF NEW.last_sign_in_at IS NULL AND OLD.last_sign_in_at IS NULL THEN
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action,
      details
    ) VALUES (
      NEW.id,
      'failed_login_attempt',
      jsonb_build_object(
        'user_id', NEW.id,
        'email', NEW.email,
        'timestamp', now(),
        'attempt_count', COALESCE((
          SELECT COUNT(*) 
          FROM public.admin_audit_log 
          WHERE action = 'failed_login_attempt' 
          AND details->>'user_id' = NEW.id::text
          AND created_at > now() - interval '1 hour'
        ), 0) + 1
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Enhanced password security validation function
CREATE OR REPLACE FUNCTION public.validate_password_strength(password_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb := '{"valid": true, "issues": []}'::jsonb;
  issues text[] := ARRAY[]::text[];
BEGIN
  -- Check minimum length
  IF length(password_text) < 12 THEN
    issues := array_append(issues, 'Password must be at least 12 characters long');
  END IF;
  
  -- Check for uppercase letter
  IF password_text !~ '[A-Z]' THEN
    issues := array_append(issues, 'Password must contain at least one uppercase letter');
  END IF;
  
  -- Check for lowercase letter
  IF password_text !~ '[a-z]' THEN
    issues := array_append(issues, 'Password must contain at least one lowercase letter');
  END IF;
  
  -- Check for number
  IF password_text !~ '[0-9]' THEN
    issues := array_append(issues, 'Password must contain at least one number');
  END IF;
  
  -- Check for special character
  IF password_text !~ '[^A-Za-z0-9]' THEN
    issues := array_append(issues, 'Password must contain at least one special character');
  END IF;
  
  -- Check for common patterns
  IF password_text ~* '(password|123456|qwerty|admin)' THEN
    issues := array_append(issues, 'Password contains common patterns that are not allowed');
  END IF;
  
  -- Build result
  result := jsonb_build_object(
    'valid', array_length(issues, 1) IS NULL,
    'issues', to_jsonb(issues),
    'strength_score', CASE 
      WHEN array_length(issues, 1) IS NULL THEN 5
      WHEN array_length(issues, 1) <= 2 THEN 3
      ELSE 1
    END
  );
  
  RETURN result;
END;
$$;

-- 5. Create security audit cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Keep critical logs longer, clean up routine logs
  DELETE FROM public.admin_audit_log 
  WHERE created_at < now() - interval '90 days'
  AND action NOT LIKE '%SENSITIVE_ACCESS%'
  AND action NOT LIKE '%failed_login%'
  AND action NOT LIKE '%password_reset%';
  
  -- Keep sensitive access logs for 1 year
  DELETE FROM public.admin_audit_log 
  WHERE created_at < now() - interval '365 days'
  AND action LIKE '%SENSITIVE_ACCESS%';
END;
$$;