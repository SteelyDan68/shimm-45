-- Skapa komplett GDPR requests system
CREATE TABLE IF NOT EXISTS public.gdpr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('data_export', 'data_deletion', 'data_portability', 'data_access')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'completed')),
  reason TEXT,
  user_message TEXT,
  admin_notes TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  approved_by UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own GDPR requests" 
ON public.gdpr_requests FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own GDPR requests" 
ON public.gdpr_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all GDPR requests" 
ON public.gdpr_requests FOR SELECT 
USING (is_admin(auth.uid()) OR superadmin_god_mode(auth.uid()));

CREATE POLICY "Admins can update GDPR requests" 
ON public.gdpr_requests FOR UPDATE 
USING (is_admin(auth.uid()) OR superadmin_god_mode(auth.uid()));

-- Skapa notifikationssystem för GDPR
CREATE TABLE IF NOT EXISTS public.gdpr_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.gdpr_requests(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('new_request', 'request_approved', 'request_completed', 'request_rejected')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS för notifications
ALTER TABLE public.gdpr_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies för notifications
CREATE POLICY "Admins can view notifications assigned to them" 
ON public.gdpr_notifications FOR SELECT 
USING (auth.uid() = admin_user_id);

CREATE POLICY "System can insert notifications" 
ON public.gdpr_notifications FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can update their notifications" 
ON public.gdpr_notifications FOR UPDATE 
USING (auth.uid() = admin_user_id);

-- Trigger för automatisk notifiering vid nya GDPR requests
CREATE OR REPLACE FUNCTION notify_admins_of_gdpr_request()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- Notifiera alla admins och superadmins
  FOR admin_record IN 
    SELECT DISTINCT ur.user_id 
    FROM user_roles ur 
    WHERE ur.role IN ('admin', 'superadmin')
  LOOP
    INSERT INTO public.gdpr_notifications (
      request_id,
      admin_user_id,
      notification_type,
      message,
      priority
    ) VALUES (
      NEW.id,
      admin_record.user_id,
      'new_request',
      format('Ny GDPR-begäran: %s från användare %s', NEW.request_type, 
        (SELECT email FROM profiles WHERE id = NEW.user_id)),
      CASE 
        WHEN NEW.request_type = 'data_deletion' THEN 'high'
        ELSE 'medium'
      END
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_admins_gdpr
  AFTER INSERT ON public.gdpr_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_of_gdpr_request();

-- Trigger för updated_at
CREATE OR REPLACE FUNCTION update_gdpr_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gdpr_requests_updated_at
  BEFORE UPDATE ON public.gdpr_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_gdpr_requests_updated_at();

-- Index för prestanda
CREATE INDEX idx_gdpr_requests_user_id ON public.gdpr_requests(user_id);
CREATE INDEX idx_gdpr_requests_status ON public.gdpr_requests(status);
CREATE INDEX idx_gdpr_requests_type ON public.gdpr_requests(request_type);
CREATE INDEX idx_gdpr_notifications_admin_user ON public.gdpr_notifications(admin_user_id);
CREATE INDEX idx_gdpr_notifications_unread ON public.gdpr_notifications(admin_user_id, is_read) WHERE is_read = FALSE;