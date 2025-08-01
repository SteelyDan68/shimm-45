-- Uppdatera handle_new_user trigger för att inte skapa automatisk 'user' roll för admin-skapade användare
-- Vi kommer bara tilldela den roll som specificeras av admin funktionen

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
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
  
  -- Tilldela bara 'user' roll om ingen annan roll specificeras
  -- (Admin-funktioner hanterar sina egna rolltilldelningar)
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Ta bort dubbletter och korrigera Börjes roller
DELETE FROM user_roles WHERE user_id = '0e88ea95-cf7b-4319-bca7-e0bd3f9e8aaf' AND role = 'user';

-- Förbättra RLS policies för profiles tabellen
-- Ta bort befintliga policies
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;  
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Skapa förbättrade policies med tydligare prioritering
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

CREATE POLICY "Coaches can view and update client profiles"
ON public.profiles  
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'coach') AND (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = profiles.id 
      AND ur.role IN ('client', 'user')
    )
  )
);

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