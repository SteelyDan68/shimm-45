-- ENSURE SUPERADMIN GOD MODE - Update database functions for absolute superadmin access

-- Update is_admin function to recognize superadmin god mode
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('superadmin', 'admin')
  )
$function$;

-- Create/Update superadmin god mode function
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'superadmin'
  )
$function$;

-- Create god mode override function for superadmins
CREATE OR REPLACE FUNCTION public.superadmin_god_mode(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Superadmin has unlimited god mode access to everything
  SELECT public.is_superadmin(_user_id);
$function$;