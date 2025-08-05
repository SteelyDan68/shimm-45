-- CRITICAL SECURITY FIXES FOR SHIMM - CORRECTED VERSION
-- Fix overly permissive RLS policies and missing policies

-- 1. Fix overly permissive policies that allow unrestricted access

-- Fix profiles table - remove overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles for messaging" ON profiles;

-- Create secure profiles policies (check if they don't exist already)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view their own profile') THEN
    CREATE POLICY "Users can view their own profile" 
    ON profiles FOR SELECT 
    USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admins can view all profiles') THEN
    CREATE POLICY "Admins can view all profiles" 
    ON profiles FOR SELECT 
    USING (public.is_admin(auth.uid()));
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

-- Create secure organizations policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'organizations' AND policyname = 'Organization members can view their organizations') THEN
    CREATE POLICY "Organization members can view their organizations" 
    ON organizations FOR SELECT 
    USING (
      public.is_organization_member(auth.uid(), id) 
      OR public.is_admin(auth.uid())
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'organizations' AND policyname = 'Admins can manage organizations') THEN
    CREATE POLICY "Admins can manage organizations" 
    ON organizations FOR ALL 
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;

-- Fix stefan_memory table - remove unrestricted access
DROP POLICY IF EXISTS "Anyone can view Stefan memories" ON stefan_memory;

-- Create secure stefan_memory policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stefan_memory' AND policyname = 'Admins can manage Stefan memories') THEN
    CREATE POLICY "Admins can manage Stefan memories" 
    ON stefan_memory FOR ALL 
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stefan_memory' AND policyname = 'System can insert Stefan memories') THEN
    CREATE POLICY "System can insert Stefan memories" 
    ON stefan_memory FOR INSERT 
    WITH CHECK (true);
  END IF;
END $$;

-- Fix user_presence table - remove unrestricted access
DROP POLICY IF EXISTS "Anyone can view user presence" ON user_presence;

-- Create secure user_presence policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_presence' AND policyname = 'Users can view their own presence') THEN
    CREATE POLICY "Users can view their own presence" 
    ON user_presence FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_presence' AND policyname = 'Admins can view all user presence') THEN
    CREATE POLICY "Admins can view all user presence" 
    ON user_presence FOR SELECT 
    USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- 2. Add missing RLS policies for PRD tables
DO $$ 
BEGIN
  -- PRD Components
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prd_components' AND policyname = 'Users can manage their own PRD components') THEN
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
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prd_components' AND policyname = 'Admins can manage all PRD components') THEN
    CREATE POLICY "Admins can manage all PRD components" 
    ON prd_components FOR ALL 
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
  END IF;

  -- PRD Features  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prd_features' AND policyname = 'Users can manage their own PRD features') THEN
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
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prd_features' AND policyname = 'Admins can manage all PRD features') THEN
    CREATE POLICY "Admins can manage all PRD features" 
    ON prd_features FOR ALL 
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
  END IF;

  -- PRD Documents
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prd_documents' AND policyname = 'Users can manage their own PRD documents') THEN
    CREATE POLICY "Users can manage their own PRD documents" 
    ON prd_documents FOR ALL 
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prd_documents' AND policyname = 'Admins can manage all PRD documents') THEN
    CREATE POLICY "Admins can manage all PRD documents" 
    ON prd_documents FOR ALL 
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
  END IF;

  -- PRD Architecture Nodes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prd_architecture_nodes' AND policyname = 'Users can manage their own PRD architecture nodes') THEN
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
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prd_architecture_nodes' AND policyname = 'Admins can manage all PRD architecture nodes') THEN
    CREATE POLICY "Admins can manage all PRD architecture nodes" 
    ON prd_architecture_nodes FOR ALL 
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
  END IF;

  -- PRD Architecture Edges
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prd_architecture_edges' AND policyname = 'Users can manage their own PRD architecture edges') THEN
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
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prd_architecture_edges' AND policyname = 'Admins can manage all PRD architecture edges') THEN
    CREATE POLICY "Admins can manage all PRD architecture edges" 
    ON prd_architecture_edges FOR ALL 
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;