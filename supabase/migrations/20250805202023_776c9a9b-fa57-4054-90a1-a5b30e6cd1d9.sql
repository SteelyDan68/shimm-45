-- Fix the calendar_events and tasks RLS policies
-- Drop existing problematic policies first
DROP POLICY IF EXISTS "calendar_events_select_policy" ON calendar_events;
DROP POLICY IF EXISTS "calendar_events_insert_policy" ON calendar_events;
DROP POLICY IF EXISTS "calendar_events_update_policy" ON calendar_events;
DROP POLICY IF EXISTS "calendar_events_delete_policy" ON calendar_events;

DROP POLICY IF EXISTS "tasks_select_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON tasks;

-- Create comprehensive RLS policies for calendar_events
CREATE POLICY "calendar_events_superadmin_access" 
ON calendar_events FOR ALL 
USING (public.superadmin_god_mode(auth.uid()))
WITH CHECK (public.superadmin_god_mode(auth.uid()));

CREATE POLICY "calendar_events_admin_access" 
ON calendar_events FOR ALL 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "calendar_events_coach_client_access" 
ON calendar_events FOR ALL 
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = calendar_events.user_id 
    AND cca.is_active = true
  )
)
WITH CHECK (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = calendar_events.user_id 
    AND cca.is_active = true
  )
);

-- Create comprehensive RLS policies for tasks
CREATE POLICY "tasks_superadmin_access" 
ON tasks FOR ALL 
USING (public.superadmin_god_mode(auth.uid()))
WITH CHECK (public.superadmin_god_mode(auth.uid()));

CREATE POLICY "tasks_admin_access" 
ON tasks FOR ALL 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "tasks_coach_client_access" 
ON tasks FOR ALL 
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = tasks.user_id 
    AND cca.is_active = true
  )
)
WITH CHECK (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = tasks.user_id 
    AND cca.is_active = true
  )
);