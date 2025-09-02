-- Create server_log_events table for UI telemetry
CREATE TABLE IF NOT EXISTS public.server_log_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL,
  event TEXT NOT NULL CHECK (event IN ('view_empty','404')),
  path TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.server_log_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous) to insert, but tie to auth.uid() when provided
DROP POLICY IF EXISTS "Public can insert server log events" ON public.server_log_events;
CREATE POLICY "Public can insert server log events"
ON public.server_log_events
FOR INSERT
WITH CHECK (
  auth.uid() IS NULL OR auth.uid() = user_id OR user_id IS NULL
);

-- Allow admins/superadmins to read logs
DROP POLICY IF EXISTS "Admins can view server log events" ON public.server_log_events;
CREATE POLICY "Admins can view server log events"
ON public.server_log_events
FOR SELECT
USING (is_admin(auth.uid()) OR is_superadmin(auth.uid()));

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_server_log_events_created_at ON public.server_log_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_server_log_events_event ON public.server_log_events (event);
CREATE INDEX IF NOT EXISTS idx_server_log_events_path ON public.server_log_events (path);
