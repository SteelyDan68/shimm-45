-- Fix RLS policy for client_pillar_activations to allow admins to activate pillars
DROP POLICY IF EXISTS "Users can manage pillar activations for their clients" ON public.client_pillar_activations;

-- Create new policies that allow both owners and admins
CREATE POLICY "Users can manage pillar activations for their clients" 
ON public.client_pillar_activations 
FOR ALL 
USING (
  (EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = client_pillar_activations.client_id AND c.user_id = auth.uid()
  )) OR is_admin(auth.uid())
)
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = client_pillar_activations.client_id AND c.user_id = auth.uid()
  )) OR is_admin(auth.uid())
);