-- 1) Link tasks to programs and add coach policies + limit to 2 active plans

-- Add plan_id to calendar_actionables to relate tasks to a program
ALTER TABLE public.calendar_actionables
ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.ai_coaching_plans(id) ON DELETE SET NULL;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_calendar_actionables_plan_id ON public.calendar_actionables(plan_id);

-- 2) RLS: allow coaches to manage their clients' AI coaching plans
-- Ensure table has RLS enabled already (it is). Add additional policies for coaches

DO $$ BEGIN
  -- SELECT policy for coaches
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ai_coaching_plans' AND policyname = 'Coaches can view clients plans'
  ) THEN
    CREATE POLICY "Coaches can view clients plans"
    ON public.ai_coaching_plans
    FOR SELECT
    USING (public.is_coach_of_client(auth.uid(), user_id));
  END IF;

  -- INSERT policy for coaches
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ai_coaching_plans' AND policyname = 'Coaches can create clients plans'
  ) THEN
    CREATE POLICY "Coaches can create clients plans"
    ON public.ai_coaching_plans
    FOR INSERT
    WITH CHECK (public.is_coach_of_client(auth.uid(), user_id));
  END IF;

  -- UPDATE policy for coaches
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ai_coaching_plans' AND policyname = 'Coaches can update clients plans'
  ) THEN
    CREATE POLICY "Coaches can update clients plans"
    ON public.ai_coaching_plans
    FOR UPDATE
    USING (public.is_coach_of_client(auth.uid(), user_id))
    WITH CHECK (public.is_coach_of_client(auth.uid(), user_id));
  END IF;
END $$;

-- 3) Enforce max two active plans per user
CREATE OR REPLACE FUNCTION public.enforce_max_two_active_plans()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  active_count INTEGER;
  new_status TEXT;
  target_user uuid;
BEGIN
  new_status := COALESCE(NEW.status, 'active');
  target_user := COALESCE(NEW.user_id, OLD.user_id);

  IF new_status = 'active' THEN
    SELECT COUNT(*) INTO active_count
    FROM public.ai_coaching_plans p
    WHERE p.user_id = target_user
      AND p.status = 'active'
      AND (OLD.id IS NULL OR p.id <> OLD.id);

    -- If inserting a new active plan, count existing actives; if updating to active, same logic
    IF TG_OP = 'INSERT' THEN
      IF active_count >= 2 THEN
        RAISE EXCEPTION 'Du kan ha max två aktiva program samtidigt.' USING ERRCODE = 'check_violation';
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      -- If status transitions to active, ensure we won't exceed 2
      IF (OLD.status IS DISTINCT FROM 'active') AND (new_status = 'active') THEN
        IF active_count >= 2 THEN
          RAISE EXCEPTION 'Du kan ha max två aktiva program samtidigt.' USING ERRCODE = 'check_violation';
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_max_two_active_plans ON public.ai_coaching_plans;
CREATE TRIGGER trg_enforce_max_two_active_plans
BEFORE INSERT OR UPDATE ON public.ai_coaching_plans
FOR EACH ROW
EXECUTE FUNCTION public.enforce_max_two_active_plans();