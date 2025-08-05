-- FIXA KRITISKA SÄKERHETSPROBLEM

-- Aktivera RLS på backup-tabeller
ALTER TABLE public.backup_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_coach_client_assignments ENABLE ROW LEVEL SECURITY;

-- Lägg till policies för backup-tabeller (endast superadmin access)
CREATE POLICY "Only superadmin can access backup tables" 
ON public.backup_user_roles 
FOR ALL 
USING (superadmin_god_mode(auth.uid()))
WITH CHECK (superadmin_god_mode(auth.uid()));

CREATE POLICY "Only superadmin can access backup tables" 
ON public.backup_coach_client_assignments 
FOR ALL 
USING (superadmin_god_mode(auth.uid()))
WITH CHECK (superadmin_god_mode(auth.uid()));