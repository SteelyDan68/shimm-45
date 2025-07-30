-- Lägg till RLS-policy för klienter att läsa sina egna data baserat på email
CREATE POLICY "Clients can view their own profile by email" 
ON public.clients 
FOR SELECT 
USING (email = auth.jwt() ->> 'email');

-- Lägg till RLS-policy för klienter att se sina tasks
CREATE POLICY "Clients can view their own tasks by email" 
ON public.tasks 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM clients 
  WHERE clients.id = tasks.client_id 
  AND clients.email = auth.jwt() ->> 'email'
));

-- Lägg till RLS-policy för klienter att uppdatera sina tasks (markera som klara)
CREATE POLICY "Clients can update their own tasks by email" 
ON public.tasks 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM clients 
  WHERE clients.id = tasks.client_id 
  AND clients.email = auth.jwt() ->> 'email'
));

-- Lägg till RLS-policy för klienter att se sina path entries
CREATE POLICY "Clients can view their own path entries by email" 
ON public.path_entries 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM clients 
  WHERE clients.id = path_entries.client_id 
  AND clients.email = auth.jwt() ->> 'email'
));

-- Lägg till RLS-policy för klienter att skapa sina egna path entries (assessments)
CREATE POLICY "Clients can create their own path entries by email" 
ON public.path_entries 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM clients 
  WHERE clients.id = path_entries.client_id 
  AND clients.email = auth.jwt() ->> 'email'
) AND created_by = auth.uid());