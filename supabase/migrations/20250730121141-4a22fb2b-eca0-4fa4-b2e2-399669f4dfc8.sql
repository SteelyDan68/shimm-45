-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule weekly summary emails every Monday at 9:00 AM
SELECT cron.schedule(
  'weekly-summary-email',
  '0 9 * * 1', -- Every Monday at 9:00 AM
  $$
  SELECT
    net.http_post(
        url:='https://gcoorbcglxczmukzcmqs.supabase.co/functions/v1/weekly-summary-email',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjb29yYmNnbHhjem11a3pjbXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTE3NzYsImV4cCI6MjA2OTM4Nzc3Nn0.5gNGvMZ6aG3UXoYR6XbJPqn8L8ktMYaFbZIQ4mZTFf4"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Create a table to track email sending history
CREATE TABLE IF NOT EXISTS weekly_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  client_email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the email logs table
ALTER TABLE weekly_email_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email logs
CREATE POLICY "Admins can view all email logs" ON weekly_email_logs
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Users can view email logs for their clients" ON weekly_email_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients c 
      WHERE c.id = weekly_email_logs.client_id 
      AND c.user_id = auth.uid()
    )
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_weekly_email_logs_client_id ON weekly_email_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_weekly_email_logs_sent_at ON weekly_email_logs(sent_at);

-- Add trigger for updated_at timestamp
CREATE TRIGGER update_weekly_email_logs_updated_at
  BEFORE UPDATE ON weekly_email_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();