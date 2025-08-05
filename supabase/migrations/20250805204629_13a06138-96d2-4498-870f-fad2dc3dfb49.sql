-- CRITICAL SECURITY FIXES - Phase 3: Final Security Hardening

-- 1. Find and fix remaining functions without search_path
-- First, let's update any remaining functions that need search_path

CREATE OR REPLACE FUNCTION public.create_default_notification_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE conversations 
  SET last_message_at = NEW.created_at,
      updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- 2. Check if there are any views with SECURITY DEFINER and replace them
-- Note: We need to identify the problematic view first

-- 3. Create a security monitoring view (without SECURITY DEFINER)
CREATE OR REPLACE VIEW public.security_summary AS
SELECT 
  'User Roles' as category,
  COUNT(*) as total_count,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
  COUNT(CASE WHEN role = 'superadmin' THEN 1 END) as superadmin_count
FROM public.user_roles
UNION ALL
SELECT 
  'Recent Audit Events' as category,
  COUNT(*) as total_count,
  COUNT(CASE WHEN action LIKE '%SENSITIVE%' THEN 1 END) as sensitive_count,
  COUNT(CASE WHEN created_at > now() - interval '24 hours' THEN 1 END) as recent_count
FROM public.admin_audit_log;

-- 4. Enhanced security monitoring function for real-time alerts
CREATE OR REPLACE FUNCTION public.check_security_violations()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  violations jsonb := '[]'::jsonb;
  failed_logins_24h integer;
  admin_actions_1h integer;
  sensitive_access_1h integer;
BEGIN
  -- Check for excessive failed logins in last 24 hours
  SELECT COUNT(*) INTO failed_logins_24h
  FROM public.admin_audit_log 
  WHERE action = 'failed_login_attempt' 
  AND created_at > now() - interval '24 hours';
  
  IF failed_logins_24h > 50 THEN
    violations := violations || jsonb_build_object(
      'type', 'excessive_failed_logins',
      'severity', 'high',
      'count', failed_logins_24h,
      'threshold', 50,
      'message', 'Unusual number of failed login attempts detected'
    );
  END IF;
  
  -- Check for excessive admin actions in last hour
  SELECT COUNT(*) INTO admin_actions_1h
  FROM public.admin_audit_log 
  WHERE created_at > now() - interval '1 hour'
  AND action NOT LIKE '%login%';
  
  IF admin_actions_1h > 100 THEN
    violations := violations || jsonb_build_object(
      'type', 'excessive_admin_activity',
      'severity', 'medium',
      'count', admin_actions_1h,
      'threshold', 100,
      'message', 'High volume of admin activity detected'
    );
  END IF;
  
  -- Check for sensitive data access patterns
  SELECT COUNT(*) INTO sensitive_access_1h
  FROM public.admin_audit_log 
  WHERE action LIKE '%SENSITIVE_ACCESS%'
  AND created_at > now() - interval '1 hour';
  
  IF sensitive_access_1h > 20 THEN
    violations := violations || jsonb_build_object(
      'type', 'excessive_sensitive_access',
      'severity', 'high',
      'count', sensitive_access_1h,
      'threshold', 20,
      'message', 'Unusual access to sensitive data detected'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'violations', violations,
    'checked_at', now(),
    'status', CASE WHEN jsonb_array_length(violations) = 0 THEN 'clean' ELSE 'violations_detected' END
  );
END;
$$;

-- 5. Create a secure function to handle invitation token validation
CREATE OR REPLACE FUNCTION public.secure_validate_invitation(token_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  invitation_record record;
  validation_result jsonb;
BEGIN
  -- Rate limiting check
  IF NOT public.validate_invitation_security('', token_param) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Rate limit exceeded or security violation detected'
    );
  END IF;
  
  -- Find and validate invitation
  SELECT * INTO invitation_record
  FROM public.invitations 
  WHERE token = token_param 
  AND status = 'pending' 
  AND expires_at > now();
  
  IF invitation_record IS NULL THEN
    -- Log invalid token attempt
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action,
      details
    ) VALUES (
      auth.uid(),
      'invalid_invitation_token',
      jsonb_build_object(
        'token_prefix', left(token_param, 8),
        'timestamp', now(),
        'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for'
      )
    );
    
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid or expired invitation token'
    );
  END IF;
  
  -- Return valid invitation data
  RETURN jsonb_build_object(
    'valid', true,
    'invitation_id', invitation_record.id,
    'email', invitation_record.email,
    'role', invitation_record.invited_role,
    'expires_at', invitation_record.expires_at
  );
END;
$$;