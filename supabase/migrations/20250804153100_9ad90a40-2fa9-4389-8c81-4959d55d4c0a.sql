-- Fix message sending for coach-client relationships
-- Drop the problematic complex policy and create a simpler one

DROP POLICY IF EXISTS "Enhanced message sending" ON public.messages;

-- Create a simple and robust policy for coach-client messaging
CREATE POLICY "Coach client message sending" ON public.messages
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id 
  AND (
    -- Allow messaging between assigned coach and client
    EXISTS (
      SELECT 1 
      FROM public.coach_client_assignments cca 
      WHERE cca.is_active = true
      AND (
        (cca.coach_id = auth.uid() AND cca.client_id = receiver_id) OR
        (cca.client_id = auth.uid() AND cca.coach_id = receiver_id)
      )
    )
    -- Or if user is admin/superadmin
    OR is_admin(auth.uid())
  )
);