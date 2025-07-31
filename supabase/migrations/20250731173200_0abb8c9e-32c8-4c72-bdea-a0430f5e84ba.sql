-- Fix RLS policy for clients creating their own assessment path entries
DROP POLICY IF EXISTS "Clients can create their own path entries by email" ON public.path_entries;
DROP POLICY IF EXISTS "Users can create path entries for their clients" ON public.path_entries;

-- Create new policy that allows clients to create path entries for themselves
CREATE POLICY "Users can create path entries for their own client profile" 
ON public.path_entries 
FOR INSERT 
WITH CHECK (
  -- User can create entries for clients they manage OR for their own client profile
  (EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = client_id AND c.user_id = auth.uid()
  )) 
  OR 
  -- User can create entries where they are both the client and creator
  (client_id::text = auth.uid()::text AND created_by = auth.uid())
);