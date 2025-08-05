-- CRITICAL SECURITY FIXES FOR SHIMM
-- Fix overly permissive RLS policies and missing policies

-- 1. Fix overly permissive policies that allow unrestricted access

-- Fix profiles table - remove overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles for messaging" ON profiles;

-- Create secure profiles policies
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Coaches can view their clients profiles" 
ON profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = profiles.id 
    AND cca.is_active = true
  )
);

CREATE POLICY "Superadmin god mode - profiles" 
ON profiles FOR ALL 
USING (public.superadmin_god_mode(auth.uid()))
WITH CHECK (public.superadmin_god_mode(auth.uid()));

-- Fix organizations table - remove unrestricted access
DROP POLICY IF EXISTS "Anyone can view organizations" ON organizations;

-- Create secure organizations policies
CREATE POLICY "Organization members can view their organizations" 
ON organizations FOR SELECT 
USING (
  public.is_organization_member(auth.uid(), id) 
  OR public.is_admin(auth.uid())
);

CREATE POLICY "Admins can manage organizations" 
ON organizations FOR ALL 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Fix stefan_memory table - remove unrestricted access
DROP POLICY IF EXISTS "Anyone can view Stefan memories" ON stefan_memory;

-- Create secure stefan_memory policies
CREATE POLICY "Admins can manage Stefan memories" 
ON stefan_memory FOR ALL 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "System can insert Stefan memories" 
ON stefan_memory FOR INSERT 
WITH CHECK (true);

-- Fix user_presence table - remove unrestricted access
DROP POLICY IF EXISTS "Anyone can view user presence" ON user_presence;

-- Create secure user_presence policies
CREATE POLICY "Users can view their own presence" 
ON user_presence FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all user presence" 
ON user_presence FOR SELECT 
USING (public.is_admin(auth.uid()));

-- 2. Add missing RLS policies for PRD tables

-- PRD Components
CREATE POLICY "Users can manage their own PRD components" 
ON prd_components FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM prd_documents pd 
    WHERE pd.id = prd_components.document_id 
    AND pd.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM prd_documents pd 
    WHERE pd.id = prd_components.document_id 
    AND pd.created_by = auth.uid()
  )
);

CREATE POLICY "Admins can manage all PRD components" 
ON prd_components FOR ALL 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- PRD Features  
CREATE POLICY "Users can manage their own PRD features" 
ON prd_features FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM prd_documents pd 
    WHERE pd.id = prd_features.document_id 
    AND pd.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM prd_documents pd 
    WHERE pd.id = prd_features.document_id 
    AND pd.created_by = auth.uid()
  )
);

CREATE POLICY "Admins can manage all PRD features" 
ON prd_features FOR ALL 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- PRD Documents
CREATE POLICY "Users can manage their own PRD documents" 
ON prd_documents FOR ALL 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all PRD documents" 
ON prd_documents FOR ALL 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- PRD Architecture Nodes
CREATE POLICY "Users can manage their own PRD architecture nodes" 
ON prd_architecture_nodes FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM prd_documents pd 
    WHERE pd.id = prd_architecture_nodes.document_id 
    AND pd.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM prd_documents pd 
    WHERE pd.id = prd_architecture_nodes.document_id 
    AND pd.created_by = auth.uid()
  )
);

CREATE POLICY "Admins can manage all PRD architecture nodes" 
ON prd_architecture_nodes FOR ALL 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- PRD Architecture Edges
CREATE POLICY "Users can manage their own PRD architecture edges" 
ON prd_architecture_edges FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM prd_documents pd 
    WHERE pd.id = prd_architecture_edges.document_id 
    AND pd.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM prd_documents pd 
    WHERE pd.id = prd_architecture_edges.document_id 
    AND pd.created_by = auth.uid()
  )
);

CREATE POLICY "Admins can manage all PRD architecture edges" 
ON prd_architecture_edges FOR ALL 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 3. Add audit logging for security functions
INSERT INTO admin_audit_log (admin_user_id, action, details) 
SELECT 
  auth.uid(),
  'security_policy_update',
  jsonb_build_object(
    'action', 'comprehensive_security_fix',
    'timestamp', now(),
    'affected_tables', ARRAY['profiles', 'organizations', 'stefan_memory', 'user_presence', 'prd_components', 'prd_features', 'prd_documents', 'prd_architecture_nodes', 'prd_architecture_edges']
  )
WHERE public.is_admin(auth.uid());