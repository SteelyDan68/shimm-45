-- PHASE 1: FORTSATT DATABASSÄKERHETSFIXAR
-- Fix 2: Hoppa över error_statistics eftersom det är en view

-- Fix 7: Skapa säker admin audit log funktionalitet
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_user_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only superadmins can view admin audit log"
ON public.admin_audit_log
FOR ALL
USING (
  public.is_superadmin(auth.uid())
);

-- Fix 8: Lägg till input validation function
CREATE OR REPLACE FUNCTION public.validate_admin_action(_admin_id uuid, _action_type text, _target_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Kontrollera att admin har rätta behörigheter
  IF NOT public.is_admin(_admin_id) THEN
    RAISE EXCEPTION 'Unauthorized: User is not an admin';
  END IF;
  
  -- Logga admin-aktionen
  INSERT INTO public.admin_audit_log (admin_user_id, action_type, target_user_id, details)
  VALUES (_admin_id, _action_type, _target_user_id, jsonb_build_object('timestamp', now()));
  
  RETURN true;
END;
$$;

-- Fix 9: Säker password reset funktion som edge function ska använda
CREATE OR REPLACE FUNCTION public.admin_reset_user_password(_admin_id uuid, _target_user_id uuid, _new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Validera admin behörighet
  IF NOT public.validate_admin_action(_admin_id, 'password_reset', _target_user_id) THEN
    RETURN false;
  END IF;
  
  -- Kontrollera att target user existerar
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _target_user_id) THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;
  
  -- Denna funktion returnerar bara true - faktiska password reset görs i edge function
  -- med Supabase Admin API för säkerhet
  RETURN true;
END;
$$;

-- Fix 10: Skapa säker notification settings table om den inte finns
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  sms_notifications BOOLEAN NOT NULL DEFAULT false,
  marketing_emails BOOLEAN NOT NULL DEFAULT false,
  weekly_summary BOOLEAN NOT NULL DEFAULT true,
  coaching_reminders BOOLEAN NOT NULL DEFAULT true,
  system_alerts BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification settings"
ON public.notification_settings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Skapa trigger för automatic notification settings
CREATE OR REPLACE FUNCTION public.create_notification_settings_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_notification_settings_trigger ON public.profiles;
CREATE TRIGGER create_notification_settings_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_notification_settings_for_new_user();