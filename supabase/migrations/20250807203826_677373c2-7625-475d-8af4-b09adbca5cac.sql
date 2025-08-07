-- 🔒 FAS 3: EDGE FUNCTION SECURITY HARDENING
-- Fixing critical security vulnerabilities in edge functions

-- 1. STÄRK ADMIN PASSWORD RESET VALIDATION
-- Uppdatera validate_admin_action funktionen för bättre säkerhet
CREATE OR REPLACE FUNCTION public.validate_admin_action(_user_id uuid, _action text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  is_admin_user boolean := false;
  user_roles text[];
  result jsonb;
  caller_ip inet;
  user_agent text;
BEGIN
  -- Förbättrad användarrollsvalidering
  SELECT array_agg(role::text) INTO user_roles
  FROM public.user_roles
  WHERE user_id = _user_id;
  
  -- Strikt admin-behörighetskontroll
  is_admin_user := (
    'admin' = ANY(user_roles) OR 
    'superadmin' = ANY(user_roles)
  );
  
  -- Förhindra icke-admin från att köra admin-funktioner
  IF NOT is_admin_user THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: User % does not have administrative privileges for action %', _user_id, _action;
  END IF;
  
  -- Extra säkerhetskontroller för känsliga operationer
  IF _action IN ('password_reset_direct', 'password_reset_email', 'user_deletion', 'role_assignment') THEN
    -- Kontrollera att användaren inte försöker utföra åtgärder på sig själv för admin-operationer
    IF _action IN ('password_reset_direct', 'password_reset_email') THEN
      -- Superadmin kan återställa alla lösenord, admin kan bara återställa icke-admin användare
      IF 'superadmin' != ANY(user_roles) THEN
        -- Kontrollera att målanvändaren inte är admin/superadmin
        DECLARE
          target_roles text[];
        BEGIN
          SELECT array_agg(role::text) INTO target_roles
          FROM public.user_roles
          WHERE user_id = (_action || '_target_user_id')::uuid;
          
          IF 'admin' = ANY(target_roles) OR 'superadmin' = ANY(target_roles) THEN
            RAISE EXCEPTION 'SECURITY VIOLATION: Regular admins cannot reset passwords for other administrators';
          END IF;
        END;
      END IF;
    END IF;
  END IF;
  
  -- Bygg säkert resultat
  result := jsonb_build_object(
    'is_admin', is_admin_user,
    'user_id', _user_id,
    'action', _action,
    'roles', user_roles,
    'validated_at', now(),
    'security_level', CASE 
      WHEN 'superadmin' = ANY(user_roles) THEN 'superadmin'
      WHEN 'admin' = ANY(user_roles) THEN 'admin'
      ELSE 'unauthorized'
    END
  );
  
  -- Säker audit logging med IP och user agent om tillgängligt
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action,
    details
  ) VALUES (
    _user_id,
    _action || '_security_validation',
    result || jsonb_build_object(
      'validation_success', true,
      'timestamp', now()
    )
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Logga säkerhetsfel
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action,
      details
    ) VALUES (
      _user_id,
      'security_validation_failed',
      jsonb_build_object(
        'action', _action,
        'error', SQLERRM,
        'user_id', _user_id,
        'timestamp', now()
      )
    );
    
    -- Re-raise säkerhetsexception
    RAISE;
END;
$function$;

-- 2. SÄKERHETSMETRIK FÖR EDGE FUNCTION MONITORING
CREATE TABLE IF NOT EXISTS public.edge_function_security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  user_id uuid,
  request_ip inet,
  user_agent text,
  authentication_method text,
  authorization_success boolean NOT NULL DEFAULT false,
  security_violation_type text,
  request_data jsonb DEFAULT '{}',
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on security logs table
ALTER TABLE public.edge_function_security_logs ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view security logs
CREATE POLICY "Only superadmins can view edge security logs"
  ON public.edge_function_security_logs
  FOR SELECT
  USING (public.superadmin_god_mode(auth.uid()));

-- System can insert security logs
CREATE POLICY "System can insert edge security logs"
  ON public.edge_function_security_logs
  FOR INSERT
  WITH CHECK (true);

-- 3. SÄKER HELPER FUNCTION FÖR EDGE FUNCTION AUTHENTICATION
CREATE OR REPLACE FUNCTION public.validate_edge_function_auth(
  _function_name text,
  _user_id uuid DEFAULT NULL,
  _required_role app_role DEFAULT 'client',
  _request_ip inet DEFAULT NULL,
  _user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_has_role boolean := false;
  user_roles text[];
  auth_result jsonb;
  violation_type text := NULL;
BEGIN
  -- Om user_id är null, kräv no authentication
  IF _user_id IS NULL THEN
    IF _required_role != 'none' THEN
      violation_type := 'missing_authentication';
      RAISE EXCEPTION 'SECURITY VIOLATION: Function % requires authentication but no user provided', _function_name;
    ELSE
      -- Public function, tillåt utan autentisering
      RETURN jsonb_build_object(
        'authorized', true,
        'user_id', null,
        'roles', '[]'::jsonb,
        'function_name', _function_name,
        'security_level', 'public'
      );
    END IF;
  END IF;
  
  -- Hämta användarens roller
  SELECT array_agg(role::text) INTO user_roles
  FROM public.user_roles
  WHERE user_id = _user_id;
  
  -- Kontrollera om användaren har den krävda rollen
  user_has_role := (
    _required_role::text = ANY(user_roles) OR
    'superadmin' = ANY(user_roles) OR
    ('admin' = ANY(user_roles) AND _required_role IN ('client', 'coach'))
  );
  
  -- Bygg auth resultat
  auth_result := jsonb_build_object(
    'authorized', user_has_role,
    'user_id', _user_id,
    'roles', array_to_json(COALESCE(user_roles, ARRAY[]::text[])),
    'function_name', _function_name,
    'required_role', _required_role,
    'security_level', CASE 
      WHEN 'superadmin' = ANY(user_roles) THEN 'superadmin'
      WHEN 'admin' = ANY(user_roles) THEN 'admin'
      WHEN 'coach' = ANY(user_roles) THEN 'coach'
      WHEN 'client' = ANY(user_roles) THEN 'client'
      ELSE 'unauthorized'
    END,
    'timestamp', now()
  );
  
  -- Logga säkerhetsvalidering
  INSERT INTO public.edge_function_security_logs (
    function_name,
    user_id,
    request_ip,
    user_agent,
    authentication_method,
    authorization_success,
    security_violation_type,
    request_data
  ) VALUES (
    _function_name,
    _user_id,
    _request_ip,
    _user_agent,
    'jwt_token',
    user_has_role,
    violation_type,
    auth_result
  );
  
  -- Kasta exception om ej auktoriserad
  IF NOT user_has_role THEN
    violation_type := 'insufficient_privileges';
    RAISE EXCEPTION 'SECURITY VIOLATION: User % does not have required role % for function %', _user_id, _required_role, _function_name;
  END IF;
  
  RETURN auth_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Logga säkerhetsfel
    INSERT INTO public.edge_function_security_logs (
      function_name,
      user_id,
      request_ip,
      user_agent,
      authentication_method,
      authorization_success,
      security_violation_type,
      request_data
    ) VALUES (
      _function_name,
      _user_id,
      _request_ip,
      _user_agent,
      'jwt_token',
      false,
      COALESCE(violation_type, 'validation_error'),
      jsonb_build_object(
        'error', SQLERRM,
        'function_name', _function_name,
        'timestamp', now()
      )
    );
    
    -- Re-raise för edge function
    RAISE;
END;
$function$;