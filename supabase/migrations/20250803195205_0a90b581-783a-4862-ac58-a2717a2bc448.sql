-- AUDIT FIX: Complete client_id elimination - Phase 3 (Fixed)
-- Fix remaining coach_insights table and add documentation

-- 1. Fix coach_insights table - rename client_id to user_id for consistency
ALTER TABLE coach_insights RENAME COLUMN client_id TO user_id;

-- 2. Add documentation comments for coach_client_assignments table
-- This table keeps client_id/coach_id naming for semantic clarity in relationships
-- but both reference user_id in the profiles table
COMMENT ON TABLE coach_client_assignments IS 'Coach-Client relationship assignments. IMPORTANT: client_id and coach_id both reference profiles.id (user_id). Names kept for semantic clarity.';
COMMENT ON COLUMN coach_client_assignments.client_id IS 'References profiles.id - this is the user_id of the client';
COMMENT ON COLUMN coach_client_assignments.coach_id IS 'References profiles.id - this is the user_id of the coach';

-- 3. Update RLS policies for coach_insights to use user_id
DROP POLICY IF EXISTS "Clients can view insights about themselves" ON coach_insights;
DROP POLICY IF EXISTS "Coaches can manage insights for their clients" ON coach_insights;

CREATE POLICY "Users can view insights about themselves" 
ON coach_insights 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Coaches can manage insights for their assigned users" 
ON coach_insights 
FOR ALL 
USING (auth.uid() = coach_id);

-- 4. Add database comment for documentation
COMMENT ON DATABASE postgres IS 'Single Source of Truth: ALL user identification uses user_id. coach_client_assignments keeps semantic names but references user_id.';