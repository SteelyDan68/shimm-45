-- Create AI response logs table
CREATE TABLE IF NOT EXISTS public.ai_response_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  user_id UUID NULL,
  identity TEXT NULL,
  provider TEXT NOT NULL, -- 'openai' | 'gemini'
  model TEXT NOT NULL,
  latency_ms INTEGER NOT NULL,
  cost_estimate NUMERIC(12,6) NULL,
  prompt_tokens INTEGER NULL,
  completion_tokens INTEGER NULL,
  total_tokens INTEGER NULL,
  request_id TEXT NULL,
  status TEXT NOT NULL, -- 'success' | 'error'
  error TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_response_logs_created_at ON public.ai_response_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_response_logs_provider ON public.ai_response_logs (provider);
CREATE INDEX IF NOT EXISTS idx_ai_response_logs_model ON public.ai_response_logs (model);
CREATE INDEX IF NOT EXISTS idx_ai_response_logs_function ON public.ai_response_logs (function_name);

-- Enable RLS and policies
ALTER TABLE public.ai_response_logs ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (edge functions may be public); restrict reads to admins
DROP POLICY IF EXISTS "ai_response_logs_insert_all" ON public.ai_response_logs;
CREATE POLICY "ai_response_logs_insert_all"
ON public.ai_response_logs
FOR INSERT
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "ai_response_logs_select_admins" ON public.ai_response_logs;
CREATE POLICY "ai_response_logs_select_admins"
ON public.ai_response_logs
FOR SELECT
USING (public.is_superadmin(auth.uid()) OR public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "ai_response_logs_update_admins" ON public.ai_response_logs;
CREATE POLICY "ai_response_logs_update_admins"
ON public.ai_response_logs
FOR UPDATE
USING (public.is_superadmin(auth.uid()) OR public.has_role(auth.uid(), 'superadmin'))
WITH CHECK (public.is_superadmin(auth.uid()) OR public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "ai_response_logs_delete_admins" ON public.ai_response_logs;
CREATE POLICY "ai_response_logs_delete_admins"
ON public.ai_response_logs
FOR DELETE
USING (public.is_superadmin(auth.uid()) OR public.has_role(auth.uid(), 'superadmin'));


-- Create rate limit table (fixed-window per minute)
CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
  id BIGSERIAL PRIMARY KEY,
  identity TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  last_request_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ai_rate_limits_identity_window UNIQUE(identity, window_start)
);

CREATE INDEX IF NOT EXISTS idx_ai_rate_limits_identity ON public.ai_rate_limits (identity);
CREATE INDEX IF NOT EXISTS idx_ai_rate_limits_window ON public.ai_rate_limits (window_start DESC);

ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow inserts/updates from anyone (edge functions), restrict selects to admins
DROP POLICY IF EXISTS "ai_rate_limits_write_all" ON public.ai_rate_limits;
CREATE POLICY "ai_rate_limits_write_all"
ON public.ai_rate_limits
FOR INSERT
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "ai_rate_limits_update_all" ON public.ai_rate_limits;
CREATE POLICY "ai_rate_limits_update_all"
ON public.ai_rate_limits
FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "ai_rate_limits_select_admins" ON public.ai_rate_limits;
CREATE POLICY "ai_rate_limits_select_admins"
ON public.ai_rate_limits
FOR SELECT
USING (public.is_superadmin(auth.uid()) OR public.has_role(auth.uid(), 'superadmin'));
