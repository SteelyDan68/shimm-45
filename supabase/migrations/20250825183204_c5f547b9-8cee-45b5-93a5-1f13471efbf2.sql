-- Server-side observability: server_log_events table
CREATE TABLE IF NOT EXISTS public.server_log_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  level text NOT NULL,
  message text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_stack text,
  user_id uuid,
  session_id text,
  url text,
  user_agent text,
  ip_address inet
);

-- Enable RLS
ALTER TABLE public.server_log_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view server log events"
ON public.server_log_events
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "System can insert server log events"
ON public.server_log_events
FOR INSERT
WITH CHECK (true);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_server_log_events_created_at ON public.server_log_events (created_at);
CREATE INDEX IF NOT EXISTS idx_server_log_events_level ON public.server_log_events (level);
CREATE INDEX IF NOT EXISTS idx_server_log_events_user_id ON public.server_log_events (user_id);
CREATE INDEX IF NOT EXISTS idx_server_log_events_session_id ON public.server_log_events (session_id);