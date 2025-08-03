-- FIX SUPERADMIN GOD MODE ACCESS - Add missing RLS policies for superadmin
-- This ensures superadmin has absolute access to all user data

-- Profiles table - ADD superadmin god mode policy
DROP POLICY IF EXISTS "Superadmin god mode - profiles" ON public.profiles;
CREATE POLICY "Superadmin god mode - profiles" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (superadmin_god_mode(auth.uid()))
WITH CHECK (superadmin_god_mode(auth.uid()));

-- User roles table - ADD superadmin god mode policy
DROP POLICY IF EXISTS "Superadmin god mode - user_roles" ON public.user_roles;
CREATE POLICY "Superadmin god mode - user_roles" 
ON public.user_roles 
FOR ALL 
TO authenticated 
USING (superadmin_god_mode(auth.uid()))
WITH CHECK (superadmin_god_mode(auth.uid()));

-- Coach client assignments - ADD superadmin god mode policy
DROP POLICY IF EXISTS "Superadmin god mode - coach_client_assignments" ON public.coach_client_assignments;
CREATE POLICY "Superadmin god mode - coach_client_assignments" 
ON public.coach_client_assignments 
FOR ALL 
TO authenticated 
USING (superadmin_god_mode(auth.uid()))
WITH CHECK (superadmin_god_mode(auth.uid()));

-- Path entries - ADD superadmin god mode policy
DROP POLICY IF EXISTS "Superadmin god mode - path_entries" ON public.path_entries;
CREATE POLICY "Superadmin god mode - path_entries" 
ON public.path_entries 
FOR ALL 
TO authenticated 
USING (superadmin_god_mode(auth.uid()))
WITH CHECK (superadmin_god_mode(auth.uid()));

-- Tasks - ADD superadmin god mode policy
DROP POLICY IF EXISTS "Superadmin god mode - tasks" ON public.tasks;
CREATE POLICY "Superadmin god mode - tasks" 
ON public.tasks 
FOR ALL 
TO authenticated 
USING (superadmin_god_mode(auth.uid()))
WITH CHECK (superadmin_god_mode(auth.uid()));

-- Assessment rounds - ADD superadmin god mode policy
DROP POLICY IF EXISTS "Superadmin god mode - assessment_rounds" ON public.assessment_rounds;
CREATE POLICY "Superadmin god mode - assessment_rounds" 
ON public.assessment_rounds 
FOR ALL 
TO authenticated 
USING (superadmin_god_mode(auth.uid()))
WITH CHECK (superadmin_god_mode(auth.uid()));

-- Client pillar activations - ADD superadmin god mode policy
DROP POLICY IF EXISTS "Superadmin god mode - client_pillar_activations" ON public.client_pillar_activations;
CREATE POLICY "Superadmin god mode - client_pillar_activations" 
ON public.client_pillar_activations 
FOR ALL 
TO authenticated 
USING (superadmin_god_mode(auth.uid()))
WITH CHECK (superadmin_god_mode(auth.uid()));

-- Pillar assessments - ADD superadmin god mode policy
DROP POLICY IF EXISTS "Superadmin god mode - pillar_assessments" ON public.pillar_assessments;
CREATE POLICY "Superadmin god mode - pillar_assessments" 
ON public.pillar_assessments 
FOR ALL 
TO authenticated 
USING (superadmin_god_mode(auth.uid()))
WITH CHECK (superadmin_god_mode(auth.uid()));

-- Messages - ADD superadmin god mode policy
DROP POLICY IF EXISTS "Superadmin god mode - messages" ON public.messages;
CREATE POLICY "Superadmin god mode - messages" 
ON public.messages 
FOR ALL 
TO authenticated 
USING (superadmin_god_mode(auth.uid()))
WITH CHECK (superadmin_god_mode(auth.uid()));

-- Welcome assessments - ADD superadmin god mode policy
DROP POLICY IF EXISTS "Superadmin god mode - welcome_assessments" ON public.welcome_assessments;
CREATE POLICY "Superadmin god mode - welcome_assessments" 
ON public.welcome_assessments 
FOR ALL 
TO authenticated 
USING (superadmin_god_mode(auth.uid()))
WITH CHECK (superadmin_god_mode(auth.uid()));

-- COMMENT: This migration ensures superadmin has god mode access to ALL user data
-- following our "Single source of truth" policy where user_id is the primary identifier