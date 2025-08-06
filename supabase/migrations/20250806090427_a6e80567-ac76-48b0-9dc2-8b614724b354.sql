-- Skapa RLS policies för user_roles tabellen som tillåter admins att hantera roller

-- Först, kontrollera om policies redan finns och ta bort dem för att skapa nya
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can manage all user roles" ON public.user_roles;

-- Policy för att användare kan se sina egna roller
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy för att superadmins kan hantera alla användarroller
CREATE POLICY "Superadmins can manage all user roles" 
ON public.user_roles 
FOR ALL 
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

-- Policy för att admins kan hantera alla användarroller (förutom superadmin roller)
CREATE POLICY "Admins can manage user roles" 
ON public.user_roles 
FOR ALL 
USING (
  public.is_admin(auth.uid()) AND 
  (role != 'superadmin' OR public.is_superadmin(auth.uid()))
)
WITH CHECK (
  public.is_admin(auth.uid()) AND 
  (role != 'superadmin' OR public.is_superadmin(auth.uid()))
);