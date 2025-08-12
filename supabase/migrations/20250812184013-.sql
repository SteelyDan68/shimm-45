-- Ensure profiles exist for all auth users and auto-create on signup

-- 1) Create or replace trigger function to create a profile row on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user_create_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Try full insert with common columns; fall back gracefully if schema differs
  BEGIN
    INSERT INTO public.profiles (id, email, created_at, updated_at, is_active)
    VALUES (NEW.id, NEW.email, now(), now(), true)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN undefined_column THEN
      -- Minimal insert if columns differ
      INSERT INTO public.profiles (id)
      VALUES (NEW.id)
      ON CONFLICT (id) DO NOTHING;
  END;
  RETURN NEW;
END;
$$;

-- 2) Ensure trigger exists on auth.users (safe to recreate)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_create_profile();

-- 3) Backfill: insert missing profiles for existing auth users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='profiles' AND column_name='email'
  ) THEN
    INSERT INTO public.profiles (id, email)
    SELECT u.id, u.email
    FROM auth.users u
    WHERE NOT EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = u.id
    );
  ELSE
    INSERT INTO public.profiles (id)
    SELECT u.id
    FROM auth.users u
    WHERE NOT EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = u.id
    );
  END IF;
END $$;