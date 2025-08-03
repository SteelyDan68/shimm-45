/**
 * 🕒 AUTOMATED PRD CRON JOB SETUP
 * 
 * Sätter upp daglig automatisk generering av PRD
 * Kör varje dag kl 02:00 för att uppdatera systemdokumentation
 */

-- Enable cron extension om det inte redan är aktiverat
SELECT cron.schedule(
  'daily-prd-generation',
  '0 2 * * *', -- Kör kl 02:00 varje natt
  $$
  SELECT
    net.http_post(
        url:='https://gcoorbcglxczmukzcmqs.supabase.co/functions/v1/generate-prd-document',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjb29yYmNnbHhjem11a3pjbXFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgxMTc3NiwiZXhwIjoyMDY5Mzg3Nzc2fQ.placeholder"}'::jsonb,
        body:='{"automated": true, "timestamp": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);

-- Skapa en logg för cron job körningar
CREATE TABLE IF NOT EXISTS public.prd_generation_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'success', -- 'success', 'failed'
  version_generated TEXT,
  execution_duration_ms INTEGER,
  error_message TEXT,
  automated BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS för logg
ALTER TABLE public.prd_generation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view PRD generation log"
ON public.prd_generation_log
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('superadmin', 'admin')
  )
);