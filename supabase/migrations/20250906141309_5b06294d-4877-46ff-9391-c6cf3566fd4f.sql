-- Harden system_notifications policies and fix function search_path

-- Drop overly-permissive insert policy if exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'system_notifications' AND policyname = 'System can insert notifications'
  ) THEN
    DROP POLICY "System can insert notifications" ON public.system_notifications;
  END IF;
END $$;

-- Create stricter insert policy (user can only insert their own notifications)
CREATE POLICY IF NOT EXISTS "Users can create their own notifications" ON public.system_notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Ensure update policy also enforces ownership
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.system_notifications;
CREATE POLICY "Users can update their own notifications" ON public.system_notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Recreate helper function with fixed search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;