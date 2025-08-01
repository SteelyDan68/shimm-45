-- Ta bort gamla RLS policies för profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Coaches can view and update client profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Skapa nya, korrekta RLS policies för profiles
CREATE POLICY "Superadmins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'superadmin'))
WITH CHECK (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated  
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches can view and update client profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'coach') AND (
    auth.uid() = id OR 
    has_role(id, 'client')
  )
)
WITH CHECK (
  has_role(auth.uid(), 'coach') AND (
    auth.uid() = id OR 
    has_role(id, 'client')
  )
);

CREATE POLICY "Clients can manage their own profile"
ON public.profiles
FOR ALL
TO authenticated
USING (auth.uid() = id AND has_role(auth.uid(), 'client'))
WITH CHECK (auth.uid() = id AND has_role(auth.uid(), 'client'));

CREATE POLICY "Users without roles can manage their own profile"
ON public.profiles
FOR ALL
TO authenticated
USING (auth.uid() = id AND NOT user_has_any_role(auth.uid()))
WITH CHECK (auth.uid() = id AND NOT user_has_any_role(auth.uid()));