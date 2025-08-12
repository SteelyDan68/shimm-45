-- Harden signup-related trigger functions to prevent NEW.user_id errors
-- 1) Ensure default notification settings are created safely using NEW.id
CREATE OR REPLACE FUNCTION public.create_default_notification_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  BEGIN
    INSERT INTO public.notification_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'create_default_notification_settings error for user %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

-- 2) Make self-care activation robust and reference NEW.id (profiles.id)
CREATE OR REPLACE FUNCTION public.activate_self_care_for_new_client()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'client_pillar_activations'
  ) THEN
    BEGIN
      INSERT INTO public.client_pillar_activations (
        client_id, pillar_key, is_active, activated_by, activated_at
      ) VALUES (
        NEW.id, 'self_care', true, NEW.id, now()
      );
    EXCEPTION
      WHEN unique_violation THEN
        RAISE LOG 'Self-care activation already exists for user: %', NEW.id;
      WHEN OTHERS THEN
        RAISE LOG 'activate_self_care_for_new_client error for user %: %', NEW.id, SQLERRM;
    END;
  ELSE
    RAISE LOG 'client_pillar_activations table missing; skipping self-care activation';
  END IF;
  RETURN NEW;
END;
$$;

-- 3) Keep the minimal handle_new_user to only insert profiles row safely
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user profiles insert error for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;