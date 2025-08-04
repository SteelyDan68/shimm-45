-- SECURITY FIX: Add missing SET search_path to security definer functions
-- This prevents schema injection attacks

-- Fix is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('superadmin', 'admin')
  )
$$;

-- Fix is_superadmin function  
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'superadmin'
  )
$$;

-- Fix superadmin_god_mode function
CREATE OR REPLACE FUNCTION public.superadmin_god_mode(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- Superadmin has unlimited god mode access to everything
  SELECT public.is_superadmin(_user_id);
$$;

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Fix get_user_roles function
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS SETOF app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- Fix user_has_any_role function
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

-- Fix get_user_organization_ids function
CREATE OR REPLACE FUNCTION public.get_user_organization_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = _user_id
    AND (invited_by IS NOT NULL OR joined_at IS NOT NULL)
$$;

-- Fix is_organization_member function
CREATE OR REPLACE FUNCTION public.is_organization_member(_user_id uuid, _organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _organization_id
      AND (invited_by IS NOT NULL OR joined_at IS NOT NULL)
  )
$$;

-- Fix get_user_context function
CREATE OR REPLACE FUNCTION public.get_user_context(target_user_id uuid)
RETURNS TABLE(user_id uuid, email text, full_name text, roles text[], primary_role text, permission_level integer, can_access boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- Fix get_user_roles_and_relationships function
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
  LEFT JOIN user_roles ur ON ur.user_id = target_user_id
  LEFT JOIN coach_client_assignments cca_as_coach ON cca_as_coach.coach_id = target_user_id AND cca_as_coach.is_active = true
  LEFT JOIN coach_client_assignments cca_as_client ON cca_as_client.client_id = target_user_id AND cca_as_client.is_active = true
  GROUP BY target_user_id;
$$;

-- Add audit logging for admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users(id) NOT NULL,
  action text NOT NULL,
  target_user_id uuid,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  timestamp timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on admin audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view audit logs
CREATE POLICY "Superadmins can view admin audit logs" ON public.admin_audit_log
FOR SELECT USING (is_superadmin(auth.uid()));

-- System can insert audit logs
CREATE POLICY "System can insert admin audit logs" ON public.admin_audit_log
FOR INSERT WITH CHECK (true);

-- Validation function for admin actions
CREATE OR REPLACE FUNCTION public.validate_admin_action(action_type text, admin_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Validate that the user is actually an admin
  IF NOT public.is_admin(admin_id) THEN
    RETURN false;
  END IF;
  
  -- Log the admin action
  INSERT INTO public.admin_audit_log (admin_user_id, action, details)
  VALUES (admin_id, action_type, jsonb_build_object('validated_at', now()));
  
  RETURN true;
END;
$$;