-- Fix security warnings by adding proper search_path to remaining functions

CREATE OR REPLACE FUNCTION public.get_user_context(target_user_id uuid)
 RETURNS TABLE(user_id uuid, email text, full_name text, roles text[], primary_role text, permission_level integer, can_access boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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
 SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.get_user_organization_ids(_user_id uuid)
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = _user_id
    AND (invited_by IS NOT NULL OR joined_at IS NOT NULL)
$function$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
 RETURNS SETOF app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
$function$;