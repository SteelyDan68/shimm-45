-- Create error_logs table for centralized error tracking
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  error_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  stack_trace TEXT,
  context TEXT,
  user_agent TEXT,
  url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  severity TEXT DEFAULT 'error' CHECK (severity IN ('error', 'warning', 'critical')),
  tags TEXT[],
  metadata JSONB
);

-- Enable Row Level Security
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at);
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX idx_error_logs_context ON public.error_logs(context);

-- RLS Policies for error_logs
CREATE POLICY "Superadmins can view all error logs" 
ON public.error_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'superadmin'
  )
);

CREATE POLICY "Admins can view their organization's error logs" 
ON public.error_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  )
);

CREATE POLICY "Service role can insert error logs" 
ON public.error_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Superadmins can update error logs" 
ON public.error_logs 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- Create function to automatically set severity based on context/message
CREATE OR REPLACE FUNCTION public.set_error_severity()
RETURNS TRIGGER AS $$
BEGIN
  -- Determine severity based on context or message content
  IF NEW.context ILIKE '%critical%' OR NEW.message ILIKE '%critical%' THEN
    NEW.severity = 'critical';
  ELSIF NEW.context ILIKE '%warning%' OR NEW.message ILIKE '%warning%' THEN
    NEW.severity = 'warning';
  ELSE
    NEW.severity = 'error';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic severity setting
CREATE TRIGGER set_error_severity_trigger
  BEFORE INSERT ON public.error_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_error_severity();

-- Create function to clean up old error logs (keep only 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_error_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.error_logs 
  WHERE created_at < now() - interval '90 days'
  AND severity != 'critical'; -- Keep critical errors longer
END;
$$ LANGUAGE plpgsql;

-- Create error statistics view
CREATE OR REPLACE VIEW public.error_statistics AS
SELECT 
  DATE(created_at) as error_date,
  severity,
  context,
  COUNT(*) as error_count,
  COUNT(DISTINCT user_id) as affected_users,
  COUNT(DISTINCT error_id) as unique_errors
FROM public.error_logs 
WHERE created_at >= now() - interval '30 days'
GROUP BY DATE(created_at), severity, context
ORDER BY error_date DESC, error_count DESC;