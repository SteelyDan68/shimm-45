-- CRITICAL SECURITY FIXES FOR SHIMM - FINAL VERSION
-- Fix overly permissive RLS policies and missing policies

-- 1. Fix overly permissive policies that allow unrestricted access

-- Fix profiles table - remove overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles for messaging" ON profiles;

-- Create secure profiles policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view their own profile') THEN
    CREATE POLICY "Users can view their own profile" 
    ON profiles FOR SELECT 
    USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Coaches can view their clients profiles') THEN
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
  END IF;
END $$;

-- Fix organizations table - remove unrestricted access
DROP POLICY IF EXISTS "Anyone can view organizations" ON organizations;

-- Fix stefan_memory table - remove unrestricted access  
DROP POLICY IF EXISTS "Anyone can view Stefan memories" ON stefan_memory;

-- Fix user_presence table - remove unrestricted access
DROP POLICY IF EXISTS "Anyone can view user presence" ON user_presence;

-- Create secure policies for newly secured tables
DO $$ 
BEGIN
  -- Organizations - only for authenticated organization members
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'organizations' AND policyname = 'Organization members and admins only') THEN
    CREATE POLICY "Organization members and admins only" 
    ON organizations FOR SELECT 
    USING (
      public.is_organization_member(auth.uid(), id) 
      OR public.is_admin(auth.uid())
      OR public.superadmin_god_mode(auth.uid())
    );
  END IF;

  -- Stefan memory - admin access only
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stefan_memory' AND policyname = 'Admin access only for Stefan memories') THEN
    CREATE POLICY "Admin access only for Stefan memories" 
    ON stefan_memory FOR SELECT 
    USING (
      public.is_admin(auth.uid()) 
      OR public.superadmin_god_mode(auth.uid())
    );
  END IF;

  -- User presence - own data only
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_presence' AND policyname = 'Users can view their own presence only') THEN
    CREATE POLICY "Users can view their own presence only" 
    ON user_presence FOR SELECT 
    USING (
      auth.uid() = user_id 
      OR public.is_admin(auth.uid())
      OR public.superadmin_god_mode(auth.uid())
    );
  END IF;
END $$;

-- 2. Add missing RLS policies for PRD tables (using correct column names)
DO $$ 
BEGIN
  -- PRD Documents - base security for all PRD tables
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prd_documents' AND policyname = 'Users can manage their own PRD documents') THEN
    CREATE POLICY "Users can manage their own PRD documents" 
    ON prd_documents FOR ALL 
    USING (auth.uid() = generated_by OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = generated_by OR public.is_admin(auth.uid()));
  END IF;

  -- PRD Components - use prd_document_id
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prd_components' AND policyname = 'Users can manage their own PRD components') THEN
    CREATE POLICY "Users can manage their own PRD components" 
    ON prd_components FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM prd_documents pd 
        WHERE pd.id = prd_components.prd_document_id 
        AND pd.generated_by = auth.uid()
      )
      OR public.is_admin(auth.uid())
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM prd_documents pd 
        WHERE pd.id = prd_components.prd_document_id 
        AND pd.generated_by = auth.uid()
      )
      OR public.is_admin(auth.uid())
    );
  END IF;

  -- PRD Features
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prd_features' AND policyname = 'Users can manage their own PRD features') THEN
    CREATE POLICY "Users can manage their own PRD features" 
    ON prd_features FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM prd_documents pd 
        WHERE pd.id = prd_features.prd_document_id 
        AND pd.generated_by = auth.uid()
      )
      OR public.is_admin(auth.uid())
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM prd_documents pd 
        WHERE pd.id = prd_features.prd_document_id 
        AND pd.generated_by = auth.uid()
      )
      OR public.is_admin(auth.uid())
    );
  END IF;

  -- PRD Architecture Nodes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prd_architecture_nodes' AND policyname = 'Users can manage their own PRD architecture nodes') THEN
    CREATE POLICY "Users can manage their own PRD architecture nodes" 
    ON prd_architecture_nodes FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM prd_documents pd 
        WHERE pd.id = prd_architecture_nodes.prd_document_id 
        AND pd.generated_by = auth.uid()
      )
      OR public.is_admin(auth.uid())
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM prd_documents pd 
        WHERE pd.id = prd_architecture_nodes.prd_document_id 
        AND pd.generated_by = auth.uid()
      )
      OR public.is_admin(auth.uid())
    );
  END IF;

  -- PRD Architecture Edges
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prd_architecture_edges' AND policyname = 'Users can manage their own PRD architecture edges') THEN
    CREATE POLICY "Users can manage their own PRD architecture edges" 
    ON prd_architecture_edges FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM prd_documents pd 
        WHERE pd.id = prd_architecture_edges.prd_document_id 
        AND pd.generated_by = auth.uid()
      )
      OR public.is_admin(auth.uid())
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM prd_documents pd 
        WHERE pd.id = prd_architecture_edges.prd_document_id 
        AND pd.generated_by = auth.uid()
      )
      OR public.is_admin(auth.uid())
    );
  END IF;
END $$;