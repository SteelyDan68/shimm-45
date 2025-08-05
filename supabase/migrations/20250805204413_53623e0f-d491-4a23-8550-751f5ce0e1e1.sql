-- CRITICAL SECURITY FIXES - Phase 1: Data Exposure Prevention

-- 1. Fix user_presence table - Remove ALL existing policies and recreate
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_presence;
DROP POLICY IF EXISTS "Public read access for user presence" ON public.user_presence;
DROP POLICY IF EXISTS "Users can view their own presence" ON public.user_presence;
DROP POLICY IF EXISTS "Users can update their own presence" ON public.user_presence;
DROP POLICY IF EXISTS "Users can insert their own presence" ON public.user_presence;
DROP POLICY IF EXISTS "Admins can view all presence data" ON public.user_presence;
DROP POLICY IF EXISTS "Coaches can view their clients presence" ON public.user_presence;

-- Create secure user_presence policies
CREATE POLICY "Users can view their own presence" 
ON public.user_presence 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all presence data" 
ON public.user_presence 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Coaches can view their clients presence" 
ON public.user_presence 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = user_presence.user_id 
    AND cca.is_active = true
  )
);

CREATE POLICY "Users can update their own presence" 
ON public.user_presence 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own presence" 
ON public.user_presence 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 2. Fix profiles table - Remove overly permissive messaging policy
DROP POLICY IF EXISTS "General profile access for messaging" ON public.profiles;
DROP POLICY IF EXISTS "Coaches can view assigned client profiles" ON public.profiles;

-- Create secure profile access policy for coaches to see their assigned clients
CREATE POLICY "Coaches can view assigned client profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id OR 
  is_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = profiles.id 
    AND cca.is_active = true
  )
);

-- 3. Fix stefan_ai_config table - Remove public access
DROP POLICY IF EXISTS "Anyone can view Stefan AI config" ON public.stefan_ai_config;
DROP POLICY IF EXISTS "Public read access for Stefan AI config" ON public.stefan_ai_config;
DROP POLICY IF EXISTS "Only admins can manage Stefan AI config" ON public.stefan_ai_config;

-- Create admin-only access for Stefan AI config
CREATE POLICY "Only admins can manage Stefan AI config" 
ON public.stefan_ai_config 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 4. Add security audit logging function
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  table_name text,
  action_type text,
  target_user_id uuid DEFAULT NULL,
  additional_context jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action,
    target_user_id,
    details
  ) VALUES (
    auth.uid(),
    format('SENSITIVE_ACCESS: %s.%s', table_name, action_type),
    target_user_id,
    jsonb_build_object(
      'table', table_name,
      'action', action_type,
      'timestamp', now(),
      'context', additional_context
    )
  );
END;
$$;

-- 5. Enhance invitation security with better validation
CREATE OR REPLACE FUNCTION public.validate_invitation_security(email_param text, token_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  invitation_count integer;
  recent_attempts integer;
BEGIN
  -- Check for too many pending invitations for same email
  SELECT COUNT(*) INTO invitation_count
  FROM public.invitations 
  WHERE email = email_param 
  AND status = 'pending' 
  AND expires_at > now();
  
  IF invitation_count > 3 THEN
    RETURN false;
  END IF;
  
  -- Check for brute force attempts on token validation
  SELECT COUNT(*) INTO recent_attempts
  FROM public.admin_audit_log 
  WHERE action LIKE '%invitation_validation%'
  AND created_at > now() - interval '1 hour'
  AND details->>'email' = email_param;
  
  IF recent_attempts > 10 THEN
    RETURN false;
  END IF;
  
  -- Log the validation attempt
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action,
    details
  ) VALUES (
    auth.uid(),
    'invitation_validation_attempt',
    jsonb_build_object(
      'email', email_param,
      'timestamp', now(),
      'success', true
    )
  );
  
  RETURN true;
END;
$$;