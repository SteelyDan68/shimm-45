-- Fix profiles table constraints for auth integration
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

-- Ensure profiles table has proper structure for auth integration
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Fix potential issues with email uniqueness
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_email_unique 
  UNIQUE (email);