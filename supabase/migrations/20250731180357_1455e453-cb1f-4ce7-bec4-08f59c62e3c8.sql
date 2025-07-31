-- Check if there are any RLS policies blocking users without roles
-- Let's check the current policies for profiles table

-- Update the user deletion to use service role key for complete deletion
-- This ensures we can delete users regardless of RLS policies

-- Update profiles RLS to ensure admins can see ALL profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Also ensure admins can delete all profiles
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;

CREATE POLICY "Admins can delete all profiles" 
ON public.profiles 
FOR DELETE 
USING (is_admin(auth.uid()));