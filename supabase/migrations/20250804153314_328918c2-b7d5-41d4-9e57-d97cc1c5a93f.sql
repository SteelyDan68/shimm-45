-- Remove the old generic message policy that conflicts with coach-client messaging
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

-- Verify we only have the correct coach-client policy
-- (The "Coach client message sending" policy should remain)