-- Add RLS policy to allow clients to view their assigned coaches' profiles
-- This is necessary for the message composer dropdown to work

CREATE POLICY "Clients can view their assigned coaches profiles" ON public.profiles
FOR SELECT 
USING (
  has_role(auth.uid(), 'client'::app_role) 
  AND EXISTS (
    SELECT 1 
    FROM public.coach_client_assignments cca 
    WHERE cca.client_id = auth.uid() 
    AND cca.coach_id = profiles.id 
    AND cca.is_active = true
  )
);