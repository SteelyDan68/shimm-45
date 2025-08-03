-- Enhanced security for messages with coach-client relationship validation
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages they send" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages they received (mark as read)" ON public.messages;

-- Create new secure policies for messages
CREATE POLICY "Coach-Client relationship messaging (SELECT)" 
ON public.messages 
FOR SELECT 
TO authenticated 
USING (
  (auth.uid() = sender_id OR auth.uid() = receiver_id) AND
  (
    -- Superadmin god mode
    superadmin_god_mode(auth.uid()) OR
    -- Users can always see their own messages
    (auth.uid() = sender_id OR auth.uid() = receiver_id) AND
    (
      -- Coach messaging their clients
      EXISTS (
        SELECT 1 FROM public.coach_client_assignments cca 
        WHERE cca.coach_id = auth.uid() 
        AND cca.client_id = CASE 
          WHEN auth.uid() = sender_id THEN receiver_id 
          ELSE sender_id 
        END
        AND cca.is_active = true
      ) OR
      -- Client messaging their coach
      EXISTS (
        SELECT 1 FROM public.coach_client_assignments cca 
        WHERE cca.client_id = auth.uid() 
        AND cca.coach_id = CASE 
          WHEN auth.uid() = sender_id THEN receiver_id 
          ELSE sender_id 
        END
        AND cca.is_active = true
      ) OR
      -- Admin/superadmin can message anyone
      EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'superadmin')
      )
    )
  )
);

CREATE POLICY "Coach-Client relationship messaging (INSERT)" 
ON public.messages 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = sender_id AND
  (
    -- Superadmin god mode
    superadmin_god_mode(auth.uid()) OR
    -- Coach messaging their clients
    EXISTS (
      SELECT 1 FROM public.coach_client_assignments cca 
      WHERE cca.coach_id = auth.uid() 
      AND cca.client_id = receiver_id
      AND cca.is_active = true
    ) OR
    -- Client messaging their coach
    EXISTS (
      SELECT 1 FROM public.coach_client_assignments cca 
      WHERE cca.client_id = auth.uid() 
      AND cca.coach_id = receiver_id
      AND cca.is_active = true
    ) OR
    -- Admin/superadmin can message anyone
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'superadmin')
    )
  )
);

CREATE POLICY "Message updates (mark as read)" 
ON public.messages 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- Create comprehensive notification system
CREATE TABLE public.notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Message notifications
  email_notifications boolean NOT NULL DEFAULT true,
  browser_notifications boolean NOT NULL DEFAULT false,
  internal_notifications boolean NOT NULL DEFAULT true,
  
  -- Coaching notifications  
  coaching_session_reminders boolean NOT NULL DEFAULT true,
  coaching_milestone_alerts boolean NOT NULL DEFAULT true,
  assessment_deadline_reminders boolean NOT NULL DEFAULT true,
  
  -- Timing preferences
  reminder_time time NOT NULL DEFAULT '09:00:00',
  deadline_reminder_hours integer NOT NULL DEFAULT 24,
  
  -- Advanced settings
  digest_frequency text NOT NULL DEFAULT 'daily' CHECK (digest_frequency IN ('never', 'daily', 'weekly')),
  quiet_hours_start time,
  quiet_hours_end time,
  weekend_notifications boolean NOT NULL DEFAULT false,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Create notifications table for tracking sent notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  notification_type text NOT NULL CHECK (notification_type IN (
    'message_received', 'message_digest',
    'coaching_session_reminder', 'coaching_milestone',
    'assessment_deadline', 'assessment_overdue',
    'task_reminder', 'task_overdue',
    'calendar_event', 'system_announcement'
  )),
  
  title text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  
  -- Delivery tracking
  is_read boolean NOT NULL DEFAULT false,
  email_sent boolean NOT NULL DEFAULT false,
  browser_sent boolean NOT NULL DEFAULT false,
  
  -- Scheduling
  scheduled_for timestamp with time zone DEFAULT now(),
  sent_at timestamp with time zone,
  read_at timestamp with time zone,
  
  -- Priority and category
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category text NOT NULL DEFAULT 'general' CHECK (category IN (
    'general', 'coaching', 'assessment', 'task', 'calendar', 'system'
  )),
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create notification delivery log for audit
CREATE TABLE public.notification_delivery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  delivery_method text NOT NULL CHECK (delivery_method IN ('email', 'browser', 'internal')),
  
  status text NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  error_message text,
  delivery_metadata jsonb DEFAULT '{}',
  
  attempted_at timestamp with time zone NOT NULL DEFAULT now(),
  delivered_at timestamp with time zone,
  
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_settings
CREATE POLICY "Users can manage their own notification settings" 
ON public.notification_settings 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all notification settings" 
ON public.notification_settings 
FOR SELECT 
TO authenticated 
USING (is_admin(auth.uid()));

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (mark as read)" 
ON public.notifications 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Admins can manage all notifications" 
ON public.notifications 
FOR ALL 
TO authenticated 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- RLS Policies for notification_delivery_log
CREATE POLICY "Users can view their notification delivery logs" 
ON public.notification_delivery_log 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.notifications n 
    WHERE n.id = notification_delivery_log.notification_id 
    AND n.user_id = auth.uid()
  )
);

CREATE POLICY "System can manage delivery logs" 
ON public.notification_delivery_log 
FOR ALL 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Admins can view all delivery logs" 
ON public.notification_delivery_log 
FOR SELECT 
TO authenticated 
USING (is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_notification_settings_user_id ON public.notification_settings(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_type_status ON public.notifications(notification_type, is_read);
CREATE INDEX idx_notifications_scheduled ON public.notifications(scheduled_for) WHERE is_read = false;
CREATE INDEX idx_delivery_log_notification_id ON public.notification_delivery_log(notification_id);

-- Create updated_at triggers
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create default notification settings for new users
CREATE OR REPLACE FUNCTION public.create_default_notification_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to create default settings when profile is created
CREATE TRIGGER create_notification_settings_for_new_user
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_notification_settings();