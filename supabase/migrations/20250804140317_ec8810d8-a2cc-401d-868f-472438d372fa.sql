-- PHASE 1: CRITICAL DATABASE SECURITY FIXES
-- Implementerar säkerhetsfixar enligt linter-rekommendationer

-- Fix 1: Säkra search_path för alla security definer funktioner
ALTER FUNCTION public.update_prd_updated_at() SET search_path = 'public';
ALTER FUNCTION public.get_user_organization_ids(uuid) SET search_path = 'public';
ALTER FUNCTION public.is_superadmin(uuid) SET search_path = 'public';
ALTER FUNCTION public.superadmin_god_mode(uuid) SET search_path = 'public';
ALTER FUNCTION public.activate_self_care_for_new_client() SET search_path = 'public';
ALTER FUNCTION public.set_invitation_token() SET search_path = 'public';
ALTER FUNCTION public.update_stefan_memory_updated_at() SET search_path = 'public';
ALTER FUNCTION public.delete_user_completely(uuid) SET search_path = 'public';
ALTER FUNCTION public.set_error_severity() SET search_path = 'public';
ALTER FUNCTION public.cleanup_old_error_logs() SET search_path = 'public';
ALTER FUNCTION public.user_has_any_role(uuid) SET search_path = 'public';
ALTER FUNCTION public.get_user_context(uuid) SET search_path = 'public';
ALTER FUNCTION public.validate_invitation_token(text) SET search_path = 'public';
ALTER FUNCTION public.update_coaching_updated_at() SET search_path = 'public';
ALTER FUNCTION public.create_coaching_progress_entry() SET search_path = 'public';
ALTER FUNCTION public.generate_invitation_token() SET search_path = 'public';
ALTER FUNCTION public.cleanup_user_references(text) SET search_path = 'public';
ALTER FUNCTION public.reset_user_welcome_assessment(uuid) SET search_path = 'public';
ALTER FUNCTION public.aggregate_analytics_data() SET search_path = 'public';
ALTER FUNCTION public.create_default_notification_settings() SET search_path = 'public';
ALTER FUNCTION public.insert_analytics_events(jsonb) SET search_path = 'public';
ALTER FUNCTION public.is_organization_member(uuid, uuid) SET search_path = 'public';
ALTER FUNCTION public.get_user_id_from_client_id(uuid) SET search_path = 'public';
ALTER FUNCTION public.get_client_id_from_user_id(uuid) SET search_path = 'public';
ALTER FUNCTION public.get_user_roles_and_relationships(uuid) SET search_path = 'public';
ALTER FUNCTION public.update_stefan_config_updated_at() SET search_path = 'public';
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = 'public';
ALTER FUNCTION public.get_user_roles(uuid) SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.is_admin(uuid) SET search_path = 'public';
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';

-- Fix 2: Lägg till RLS för error_statistics tabellen om den existerar
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'error_statistics') THEN
    ALTER TABLE public.error_statistics ENABLE ROW LEVEL SECURITY;
    
    -- Endast superadmins kan se error statistics
    CREATE POLICY "Only superadmins can view error statistics"
    ON public.error_statistics
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() 
        AND ur.role = 'superadmin'
      )
    );
  END IF;
END $$;

-- Fix 3: Skapa organizations tabellen med säkra RLS policies om den inte existerar
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Aktivera RLS för organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Ta bort eventuella osäkra policies
DROP POLICY IF EXISTS "Organizations are viewable by everyone" ON public.organizations;
DROP POLICY IF EXISTS "Anyone can view organizations" ON public.organizations;

-- Lägg till säkra RLS policies för organizations
CREATE POLICY "Organization members can view their organizations"
ON public.organizations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organizations.id 
    AND om.user_id = auth.uid()
    AND (om.invited_by IS NOT NULL OR om.joined_at IS NOT NULL)
  )
  OR 
  public.superadmin_god_mode(auth.uid())
);

CREATE POLICY "Admins can create organizations"
ON public.organizations
FOR INSERT
WITH CHECK (
  public.is_admin(auth.uid()) 
  AND auth.uid() = created_by
);

CREATE POLICY "Organization admins can update their organizations"
ON public.organizations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organizations.id 
    AND om.user_id = auth.uid()
    AND om.role = 'admin'
  )
  OR 
  public.superadmin_god_mode(auth.uid())
);

-- Fix 4: Lägg till saknade UPDATE policies för user_roles
CREATE POLICY "Only superadmins can update user roles"
ON public.user_roles
FOR UPDATE
USING (
  public.is_superadmin(auth.uid())
);

-- Fix 5: Lägg till saknade UPDATE policy för profiles
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Fix 6: Förbättra message system policies - förenkla de komplexa policies
DROP POLICY IF EXISTS "Enhanced message viewing" ON public.messages;
DROP POLICY IF EXISTS "Enhanced message sending" ON public.messages;
DROP POLICY IF EXISTS "Enhanced message updates" ON public.messages;

-- Nya, enklare och säkrare message policies
CREATE POLICY "Users can view messages they sent or received"
ON public.messages
FOR SELECT
USING (
  auth.uid() = sender_id 
  OR auth.uid() = receiver_id
  OR public.superadmin_god_mode(auth.uid())
);

CREATE POLICY "Users can send messages to assigned relationships"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id 
  AND (
    public.superadmin_god_mode(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.coach_client_assignments cca
      WHERE ((cca.coach_id = auth.uid() AND cca.client_id = receiver_id)
        OR (cca.client_id = auth.uid() AND cca.coach_id = receiver_id))
      AND cca.is_active = true
    )
  )
);

CREATE POLICY "Users can update messages they received"
ON public.messages
FOR UPDATE
USING (
  auth.uid() = receiver_id
  OR public.superadmin_god_mode(auth.uid())
);