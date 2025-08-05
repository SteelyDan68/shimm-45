-- AKUT ROLLBACK: Återskapa tabellerna från backup för att fixa systemet
CREATE TABLE IF NOT EXISTS public.user_roles AS SELECT * FROM backup_user_roles;
CREATE TABLE IF NOT EXISTS public.coach_client_assignments AS SELECT * FROM backup_coach_client_assignments;

-- Återställ RLS på återställda tabeller
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_client_assignments ENABLE ROW LEVEL SECURITY;

-- Återställ grundläggande policies
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can view coach assignments" 
ON public.coach_client_assignments 
FOR SELECT 
USING (auth.uid() = coach_id OR auth.uid() = client_id OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage coach assignments" 
ON public.coach_client_assignments 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));