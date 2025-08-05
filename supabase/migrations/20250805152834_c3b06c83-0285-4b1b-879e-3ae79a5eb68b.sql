-- =====================================================
-- SPRINT: Multi-Roll Coach Access Enhancement
-- =====================================================

-- 1. UPPDATERA RLS POLICIES FÖR COACH ACCESS TILL CLIENT DATA

-- Calendar Events - Coach kan se och hantera client kalendrar
CREATE POLICY "Coaches can view their assigned clients calendar events" 
ON calendar_events FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = calendar_events.user_id 
    AND cca.is_active = true
  )
);

CREATE POLICY "Coaches can create calendar events for their clients" 
ON calendar_events FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = calendar_events.user_id 
    AND cca.is_active = true
  )
);

CREATE POLICY "Coaches can update calendar events for their clients" 
ON calendar_events FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = calendar_events.user_id 
    AND cca.is_active = true
  )
);

-- Tasks - Coach kan se och hantera client uppgifter
CREATE POLICY "Coaches can view their assigned clients tasks" 
ON tasks FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = tasks.user_id 
    AND cca.is_active = true
  )
);

CREATE POLICY "Coaches can create tasks for their clients" 
ON tasks FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = tasks.user_id 
    AND cca.is_active = true
  )
);

CREATE POLICY "Coaches can update tasks for their clients" 
ON tasks FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = tasks.user_id 
    AND cca.is_active = true
  )
);

-- User Journey States - Coach kan se client utveckling
CREATE POLICY "Coaches can view their assigned clients journey states" 
ON user_journey_states FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = user_journey_states.user_id 
    AND cca.is_active = true
  )
);

-- Analytics Events - Coach kan se client analytics
CREATE POLICY "Coaches can view their assigned clients analytics" 
ON analytics_events FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = analytics_events.user_id 
    AND cca.is_active = true
  )
);

-- User Attributes - Coach kan se client attribut
CREATE POLICY "Coaches can view their assigned clients attributes" 
ON user_attributes FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = user_attributes.user_id 
    AND cca.is_active = true
  )
);

-- 2. SKAPA HELPER FUNCTION FÖR COACH-CLIENT CONTEXT VALIDATION
CREATE OR REPLACE FUNCTION public.is_coach_of_client(_coach_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM coach_client_assignments 
    WHERE coach_id = _coach_id 
    AND client_id = _client_id 
    AND is_active = true
  );
$$;

-- 3. SKAPA FUNCTION FÖR CONTEXT SWITCHING VALIDATION
CREATE OR REPLACE FUNCTION public.validate_role_context_switch(_user_id uuid, _from_role app_role, _to_role app_role)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  has_from_role boolean;
  has_to_role boolean;
  result jsonb;
BEGIN
  -- Kontrollera att användaren har båda rollerna
  SELECT 
    EXISTS(SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _from_role),
    EXISTS(SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _to_role)
  INTO has_from_role, has_to_role;
  
  result := jsonb_build_object(
    'valid', (has_from_role AND has_to_role),
    'has_from_role', has_from_role,
    'has_to_role', has_to_role,
    'user_id', _user_id,
    'from_role', _from_role,
    'to_role', _to_role,
    'validated_at', now()
  );
  
  RETURN result;
END;
$$;

-- 4. SKAPA INDEX FÖR PERFORMANCE PÅ COACH-CLIENT QUERIES
CREATE INDEX IF NOT EXISTS idx_coach_client_assignments_active_coach 
ON coach_client_assignments (coach_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_coach_client_assignments_active_client 
ON coach_client_assignments (client_id, is_active) 
WHERE is_active = true;

-- 5. UPPDATERA RLS POLICIES FÖR PATH ENTRIES (CLIENT HISTORIK)
CREATE POLICY "Coaches can view their assigned clients path entries" 
ON path_entries FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM coach_client_assignments cca 
    WHERE cca.coach_id = auth.uid() 
    AND cca.client_id = path_entries.user_id 
    AND cca.is_active = true
  )
);

-- KOMMENTAR: Säkerställer att coaches kan komma åt all nödvändig client-data
-- samtidigt som vi behåller säkerhetsbarriärerna för icke-tilldelade användare.