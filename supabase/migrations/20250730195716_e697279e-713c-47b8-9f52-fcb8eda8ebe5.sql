-- Lägg till RLS-policys för admin att hantera alla klienter
CREATE POLICY "Admins can view all clients" 
ON public.clients 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all clients" 
ON public.clients 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete all clients" 
ON public.clients 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Lägg också till för path_entries så admins kan se allt
CREATE POLICY "Admins can view all path entries" 
ON public.path_entries 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all path entries" 
ON public.path_entries 
FOR ALL 
USING (is_admin(auth.uid()));

-- Samma för tasks
CREATE POLICY "Admins can view all tasks" 
ON public.tasks 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all tasks" 
ON public.tasks 
FOR ALL 
USING (is_admin(auth.uid()));

-- Och för assessment_rounds
CREATE POLICY "Admins can view all assessment rounds" 
ON public.assessment_rounds 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all assessment rounds" 
ON public.assessment_rounds 
FOR ALL 
USING (is_admin(auth.uid()));

-- För pillar_assessments
CREATE POLICY "Admins can view all pillar assessments" 
ON public.pillar_assessments 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all pillar assessments" 
ON public.pillar_assessments 
FOR ALL 
USING (is_admin(auth.uid()));

-- För calendar_events
CREATE POLICY "Admins can view all calendar events" 
ON public.calendar_events 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all calendar events" 
ON public.calendar_events 
FOR ALL 
USING (is_admin(auth.uid()));

-- För client_data_cache
CREATE POLICY "Admins can view all client data cache" 
ON public.client_data_cache 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all client data cache" 
ON public.client_data_cache 
FOR ALL 
USING (is_admin(auth.uid()));