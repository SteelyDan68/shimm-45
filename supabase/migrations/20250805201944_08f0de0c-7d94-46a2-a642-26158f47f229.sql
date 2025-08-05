-- Add RLS policies for calendar_events table to support all roles
CREATE POLICY IF NOT EXISTS "calendar_events_select_policy" 
ON calendar_events FOR SELECT 
USING (
  -- User can see their own events
  auth.uid() = user_id
  OR
  -- Superadmin can see all events
  public.superadmin_god_mode(auth.uid())
  OR
  -- Admin can see all events
  public.is_admin(auth.uid())
  OR
  -- Coach can see their clients' events
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = calendar_events.user_id 
    AND cca.is_active = true
  )
);

CREATE POLICY IF NOT EXISTS "calendar_events_insert_policy" 
ON calendar_events FOR INSERT 
WITH CHECK (
  -- User can create their own events
  auth.uid() = user_id
  OR
  -- Superadmin can create events for anyone
  public.superadmin_god_mode(auth.uid())
  OR
  -- Admin can create events for anyone
  public.is_admin(auth.uid())
  OR
  -- Coach can create events for their clients
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = calendar_events.user_id 
    AND cca.is_active = true
  )
);

CREATE POLICY IF NOT EXISTS "calendar_events_update_policy" 
ON calendar_events FOR UPDATE 
USING (
  -- User can update their own events
  auth.uid() = user_id
  OR
  -- Superadmin can update all events
  public.superadmin_god_mode(auth.uid())
  OR
  -- Admin can update all events
  public.is_admin(auth.uid())
  OR
  -- Coach can update their clients' events
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = calendar_events.user_id 
    AND cca.is_active = true
  )
);

CREATE POLICY IF NOT EXISTS "calendar_events_delete_policy" 
ON calendar_events FOR DELETE 
USING (
  -- User can delete their own events
  auth.uid() = user_id
  OR
  -- Superadmin can delete all events
  public.superadmin_god_mode(auth.uid())
  OR
  -- Admin can delete all events
  public.is_admin(auth.uid())
  OR
  -- Coach can delete their clients' events
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = calendar_events.user_id 
    AND cca.is_active = true
  )
);

-- Add similar RLS policies for tasks table
CREATE POLICY IF NOT EXISTS "tasks_select_policy" 
ON tasks FOR SELECT 
USING (
  -- User can see their own tasks
  auth.uid() = user_id
  OR
  -- Superadmin can see all tasks
  public.superadmin_god_mode(auth.uid())
  OR
  -- Admin can see all tasks
  public.is_admin(auth.uid())
  OR
  -- Coach can see their clients' tasks
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = tasks.user_id 
    AND cca.is_active = true
  )
);

CREATE POLICY IF NOT EXISTS "tasks_insert_policy" 
ON tasks FOR INSERT 
WITH CHECK (
  -- User can create their own tasks
  auth.uid() = user_id
  OR
  -- Superadmin can create tasks for anyone
  public.superadmin_god_mode(auth.uid())
  OR
  -- Admin can create tasks for anyone
  public.is_admin(auth.uid())
  OR
  -- Coach can create tasks for their clients
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = tasks.user_id 
    AND cca.is_active = true
  )
);

CREATE POLICY IF NOT EXISTS "tasks_update_policy" 
ON tasks FOR UPDATE 
USING (
  -- User can update their own tasks
  auth.uid() = user_id
  OR
  -- Superadmin can update all tasks
  public.superadmin_god_mode(auth.uid())
  OR
  -- Admin can update all tasks
  public.is_admin(auth.uid())
  OR
  -- Coach can update their clients' tasks
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = tasks.user_id 
    AND cca.is_active = true
  )
);

CREATE POLICY IF NOT EXISTS "tasks_delete_policy" 
ON tasks FOR DELETE 
USING (
  -- User can delete their own tasks
  auth.uid() = user_id
  OR
  -- Superadmin can delete all tasks
  public.superadmin_god_mode(auth.uid())
  OR
  -- Admin can delete all tasks
  public.is_admin(auth.uid())
  OR
  -- Coach can delete their clients' tasks
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = tasks.user_id 
    AND cca.is_active = true
  )
);