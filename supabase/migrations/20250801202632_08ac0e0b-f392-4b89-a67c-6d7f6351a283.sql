-- Återställ RLS policies och slutför refaktoreringen

-- Uppdatera handle_new_user trigger - INGA automatiska roller
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Skapa bara profil, inga automatiska roller
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  
  -- INGEN automatisk rolltilldelning - user_id är nu universell identifierare
  RETURN NEW;
END;
$$;

-- Återställ RLS policies för profiles
CREATE POLICY "Superadmins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Admins can manage all profiles"  
ON public.profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches can view client profiles"
ON public.profiles  
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'coach') AND (
    auth.uid() = id OR 
    has_role(profiles.id, 'client')
  )
);

-- ALLA användare kan hantera sin egen profil (även utan roller)
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT  
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated  
USING (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Återställ RLS policies för user_roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Återställ policies för organization_members
CREATE POLICY "Admins can manage org memberships"
ON public.organization_members
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Org members can view other members"
ON public.organization_members
FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organization_ids(auth.uid())));

CREATE POLICY "Users can view their org memberships"
ON public.organization_members
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);