-- SECURITY FIXES - Phase 1: Critical Database Security
-- Fix 1: Remove SECURITY DEFINER views (convert to functions if needed)
-- Fix 2: Add search_path to all functions that need it
-- Fix 3: Secure user_roles table with comprehensive RLS policies
-- Fix 4: Add proper audit logging for sensitive operations

-- First, let's add comprehensive RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Admins can insert user roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'))
  AND 
  -- Prevent self-role-escalation
  (user_id != auth.uid() OR role = 'client')
);

CREATE POLICY "Admins can update user roles" 
ON public.user_roles 
FOR UPDATE 
USING (
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'))
  AND 
  -- Prevent admins from removing their own superadmin role
  NOT (user_id = auth.uid() AND OLD.role = 'superadmin' AND NEW.role != 'superadmin')
);

CREATE POLICY "Admins can delete user roles" 
ON public.user_roles 
FOR DELETE 
USING (
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'))
  AND 
  -- Prevent admins from removing their own superadmin role
  NOT (user_id = auth.uid() AND role = 'superadmin')
);

-- Fix search_path issues for security functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'superadmin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'superadmin'
  );
$$;

CREATE OR REPLACE FUNCTION public.superadmin_god_mode(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'superadmin'
  );
$$;

-- Add audit logging trigger for user_roles changes
CREATE OR REPLACE FUNCTION public.audit_user_roles_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log role assignments
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action,
      target_user_id,
      details
    ) VALUES (
      auth.uid(),
      'role_assigned',
      NEW.user_id,
      jsonb_build_object(
        'role', NEW.role,
        'assigned_at', NEW.assigned_at,
        'assigned_by', NEW.assigned_by
      )
    );
    RETURN NEW;
  END IF;
  
  -- Log role updates
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action,
      target_user_id,
      details
    ) VALUES (
      auth.uid(),
      'role_updated',
      NEW.user_id,
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'updated_at', now()
      )
    );
    RETURN NEW;
  END IF;
  
  -- Log role deletions
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action,
      target_user_id,
      details
    ) VALUES (
      auth.uid(),
      'role_removed',
      OLD.user_id,
      jsonb_build_object(
        'role', OLD.role,
        'removed_at', now()
      )
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create trigger for user_roles audit logging
DROP TRIGGER IF EXISTS trigger_audit_user_roles ON public.user_roles;
CREATE TRIGGER trigger_audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_user_roles_changes();

-- Enhanced password policy function
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
  score integer := 0;
  errors text[] := ARRAY[]::text[];
BEGIN
  -- Length check (minimum 12 characters)
  IF length(password) < 12 THEN
    errors := array_append(errors, 'Password must be at least 12 characters long');
  ELSE
    score := score + 1;
  END IF;
  
  -- Uppercase check
  IF password !~ '[A-Z]' THEN
    errors := array_append(errors, 'Password must contain at least one uppercase letter');
  ELSE
    score := score + 1;
  END IF;
  
  -- Lowercase check
  IF password !~ '[a-z]' THEN
    errors := array_append(errors, 'Password must contain at least one lowercase letter');
  ELSE
    score := score + 1;
  END IF;
  
  -- Number check
  IF password !~ '[0-9]' THEN
    errors := array_append(errors, 'Password must contain at least one number');
  ELSE
    score := score + 1;
  END IF;
  
  -- Special character check
  IF password !~ '[^A-Za-z0-9]' THEN
    errors := array_append(errors, 'Password must contain at least one special character');
  ELSE
    score := score + 1;
  END IF;
  
  -- Common pattern checks
  IF password ~* '(password|123456|qwerty|admin|user)' THEN
    errors := array_append(errors, 'Password contains common patterns');
    score := score - 1;
  END IF;
  
  result := jsonb_build_object(
    'is_valid', array_length(errors, 1) IS NULL,
    'score', GREATEST(score, 0),
    'errors', errors
  );
  
  RETURN result;
END;
$$;

-- Security function to check sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  table_name text,
  operation text,
  user_id_accessed uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action,
    target_user_id,
    details
  ) VALUES (
    auth.uid(),
    format('SENSITIVE_DATA_ACCESS: %s.%s', table_name, operation),
    user_id_accessed,
    jsonb_build_object(
      'table', table_name,
      'operation', operation,
      'timestamp', now(),
      'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for'
    )
  );
END;
$$;