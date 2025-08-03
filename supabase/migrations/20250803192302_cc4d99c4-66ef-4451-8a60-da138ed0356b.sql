-- Drop conflicting policies and create simpler ones
DROP POLICY IF EXISTS "Coach-Client relationship messaging (INSERT)" ON public.messages;
DROP POLICY IF EXISTS "Coach-Client relationship messaging (SELECT)" ON public.messages;
DROP POLICY IF EXISTS "Message updates (mark as read)" ON public.messages;

-- Create simple, working policies
-- Superadmin can do everything (already exists, but ensure it works)

-- Users can send messages to anyone they have relationship with OR if they are admin
CREATE POLICY "Enhanced message sending" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND (
    -- Superadmin god mode
    superadmin_god_mode(auth.uid()) OR
    -- Admin access
    is_admin(auth.uid()) OR
    -- Coach-client relationship exists
    EXISTS (
      SELECT 1 FROM coach_client_assignments cca 
      WHERE ((cca.coach_id = auth.uid() AND cca.client_id = receiver_id) OR 
             (cca.client_id = auth.uid() AND cca.coach_id = receiver_id))
      AND cca.is_active = true
    )
  )
);

-- Users can view messages they sent or received
CREATE POLICY "Enhanced message viewing" 
ON public.messages 
FOR SELECT 
USING (
  (auth.uid() = sender_id OR auth.uid() = receiver_id) AND (
    -- Superadmin god mode  
    superadmin_god_mode(auth.uid()) OR
    -- Admin access
    is_admin(auth.uid()) OR
    -- Coach-client relationship exists
    EXISTS (
      SELECT 1 FROM coach_client_assignments cca 
      WHERE ((cca.coach_id = auth.uid() AND cca.client_id = CASE WHEN auth.uid() = sender_id THEN receiver_id ELSE sender_id END) OR 
             (cca.client_id = auth.uid() AND cca.coach_id = CASE WHEN auth.uid() = sender_id THEN receiver_id ELSE sender_id END))
      AND cca.is_active = true
    )
  )
);

-- Users can update messages (mark as read)
CREATE POLICY "Enhanced message updates" 
ON public.messages 
FOR UPDATE 
USING (
  auth.uid() = receiver_id AND (
    -- Superadmin god mode
    superadmin_god_mode(auth.uid()) OR
    -- Admin access  
    is_admin(auth.uid()) OR
    -- Coach-client relationship exists
    EXISTS (
      SELECT 1 FROM coach_client_assignments cca 
      WHERE ((cca.coach_id = auth.uid() AND cca.client_id = sender_id) OR 
             (cca.client_id = auth.uid() AND cca.coach_id = sender_id))
      AND cca.is_active = true
    )
  )
);