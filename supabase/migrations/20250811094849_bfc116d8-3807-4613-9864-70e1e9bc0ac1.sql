DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'calendar_actionables' AND policyname = 'Coaches can manage clients actionables'
  ) THEN
    CREATE POLICY "Coaches can manage clients actionables"
    ON public.calendar_actionables
    FOR ALL
    USING (public.is_coach_of_client(auth.uid(), user_id))
    WITH CHECK (public.is_coach_of_client(auth.uid(), user_id));
  END IF;
END $$;