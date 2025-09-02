-- Create server_log_events table for UI telemetry 
-- Fixed: Drop policy if exists, table already created
DROP POLICY IF EXISTS "Admins can view server log events" ON public.server_log_events;
DROP POLICY IF EXISTS "Public can insert server log events" ON public.server_log_events;

-- Allow anyone (including anonymous) to insert, but tie to auth.uid() when provided
CREATE POLICY "Public can insert server log events"
ON public.server_log_events
FOR INSERT
WITH CHECK (
  auth.uid() IS NULL OR auth.uid() = user_id OR user_id IS NULL
);

-- Allow admins/superadmins to read logs
CREATE POLICY "Admins can view server log events"
ON public.server_log_events
FOR SELECT
USING (is_admin(auth.uid()) OR is_superadmin(auth.uid()));