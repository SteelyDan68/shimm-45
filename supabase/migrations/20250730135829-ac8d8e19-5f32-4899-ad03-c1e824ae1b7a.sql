-- Lägg till GDPR-spårning i befintliga tabeller
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS data_retention_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;

-- Skapa GDPR audit log
CREATE TABLE IF NOT EXISTS public.gdpr_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'export', 'delete', 'modify', 'consent_given', 'consent_withdrawn'
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skapa consent records tabell
CREATE TABLE IF NOT EXISTS public.user_consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL, -- 'cookies', 'analytics', 'marketing', 'data_processing'
  consent_given BOOLEAN NOT NULL,
  consent_source TEXT NOT NULL, -- 'cookie_banner', 'settings_page', 'signup'
  consent_timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skapa data export requests tabell
CREATE TABLE IF NOT EXISTS public.data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  request_date TIMESTAMPTZ DEFAULT NOW(),
  completed_date TIMESTAMPTZ,
  download_url TEXT,
  expires_at TIMESTAMPTZ,
  file_size_bytes BIGINT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skapa data deletion requests tabell
CREATE TABLE IF NOT EXISTS public.data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'processing', 'completed', 'rejected'
  request_date TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users(id),
  approved_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS på alla nya tabeller
ALTER TABLE public.gdpr_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies för gdpr_audit_log
CREATE POLICY "Users can view their own audit logs" ON public.gdpr_audit_log
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs" ON public.gdpr_audit_log
FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "System can insert audit logs" ON public.gdpr_audit_log
FOR INSERT WITH CHECK (true);

-- RLS policies för user_consent_records
CREATE POLICY "Users can view their own consent records" ON public.user_consent_records
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own consent records" ON public.user_consent_records
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consent records" ON public.user_consent_records
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all consent records" ON public.user_consent_records
FOR SELECT USING (is_admin(auth.uid()));

-- RLS policies för data_export_requests
CREATE POLICY "Users can view their own export requests" ON public.data_export_requests
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own export requests" ON public.data_export_requests
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all export requests" ON public.data_export_requests
FOR ALL USING (is_admin(auth.uid()));

-- RLS policies för data_deletion_requests
CREATE POLICY "Users can view their own deletion requests" ON public.data_deletion_requests
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deletion requests" ON public.data_deletion_requests
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all deletion requests" ON public.data_deletion_requests
FOR ALL USING (is_admin(auth.uid()));

-- Triggers för updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_consent_records_updated_at
  BEFORE UPDATE ON public.user_consent_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_export_requests_updated_at
  BEFORE UPDATE ON public.data_export_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_deletion_requests_updated_at
  BEFORE UPDATE ON public.data_deletion_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();