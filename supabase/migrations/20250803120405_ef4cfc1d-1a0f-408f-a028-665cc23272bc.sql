-- Fix Security Definer View issues
-- Replace problematic views with RLS-enabled tables or functions

-- STEP 1: Drop the problematic views
DROP VIEW IF EXISTS client_data_cache_legacy;
DROP VIEW IF EXISTS user_context_view;

-- STEP 2: Create safer function-based approach for user context
-- Update get_user_context function with proper search path
CREATE OR REPLACE FUNCTION get_user_context(target_user_id UUID)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  full_name TEXT,
  roles TEXT[],
  primary_role TEXT,
  permission_level INTEGER,
  can_access BOOLEAN
) 
LANGUAGE SQL 
STABLE 
SECURITY DEFINER 
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

-- STEP 3: Fix other functions with missing search_path
-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  
  -- Tilldela "client" roll som default om ingen annan roll specificeras
  -- Admin-funktioner kan override detta genom att ta bort default-rollen först
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Update validate_invitation_token function  
CREATE OR REPLACE FUNCTION public.validate_invitation_token(invitation_token text)
RETURNS TABLE(invitation_id uuid, email text, invited_role text, expires_at timestamp with time zone, is_valid boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.email,
    i.invited_role,
    i.expires_at,
    (i.status = 'pending' AND i.expires_at > now()) as is_valid
  FROM public.invitations i
  WHERE i.token = invitation_token;
END;
$$;

-- Update generate_invitation_token function
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  token_value TEXT;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  -- Generate a 32-character random token
  FOR i IN 1..32 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  
  token_value := result;
  
  -- Ensure it's unique by checking against the column explicitly
  WHILE EXISTS (SELECT 1 FROM public.invitations WHERE invitations.token = token_value) LOOP
    result := '';
    FOR i IN 1..32 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    token_value := result;
  END LOOP;
  
  RETURN token_value;
END;
$$;

-- Update cleanup_user_references function
CREATE OR REPLACE FUNCTION public.cleanup_user_references(target_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  cleanup_count integer := 0;
  result_msg text;
BEGIN
  -- Logga vad som görs
  RAISE LOG 'Starting cleanup for email: %', target_email;
  
  -- Rensa från alla tabeller som kan innehålla e-post eller user_id referenser
  -- (Detta kommer köras innan man försöker skapa en ny användare)
  
  -- Rensa gamla inbjudningar
  DELETE FROM public.invitations WHERE email = target_email;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  RAISE LOG 'Cleaned % invitation records for email: %', cleanup_count, target_email;
  
  -- Rensa profiler som saknar auth.users koppling
  DELETE FROM public.profiles WHERE email = target_email;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  RAISE LOG 'Cleaned % profile records for email: %', cleanup_count, target_email;
  
  -- Sammanställ resultat
  result_msg := 'Cleanup completed for email: ' || target_email;
  RAISE LOG '%', result_msg;
  
  RETURN result_msg;
END;
$$;

-- Update reset_user_welcome_assessment function
CREATE OR REPLACE FUNCTION public.reset_user_welcome_assessment(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result_msg text := '';
BEGIN
  -- Only allow users to reset their own assessment
  IF _user_id != auth.uid() THEN
    RETURN 'Access denied: Can only reset your own assessment';
  END IF;
  
  -- Delete welcome assessments for this user
  DELETE FROM public.welcome_assessments WHERE user_id = _user_id;
  
  -- Reset user journey state to allow welcome assessment again
  UPDATE public.user_journey_states 
  SET 
    current_phase = 'welcome',
    completed_assessments = '[]'::jsonb,
    journey_progress = 0,
    next_recommended_assessment = null,
    metadata = '{}'::jsonb,
    updated_at = now()
  WHERE user_id = _user_id;
  
  -- If no journey state exists, create one
  INSERT INTO public.user_journey_states (
    user_id,
    current_phase,
    completed_assessments,
    journey_progress,
    last_activity_at,
    metadata
  )
  VALUES (
    _user_id,
    'welcome',
    '[]'::jsonb,
    0,
    now(),
    '{}'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  result_msg := 'Welcome assessment reset completed for user: ' || _user_id;
  
  RETURN result_msg;
END;
$$;