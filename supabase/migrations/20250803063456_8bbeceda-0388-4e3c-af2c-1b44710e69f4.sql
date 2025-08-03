-- Fix critical security issues found by linter

-- 1. Fix function search paths for security
ALTER FUNCTION public.is_organization_member(_user_id uuid, _organization_id uuid)
SET search_path TO 'public';

ALTER FUNCTION public.get_user_organization_ids(_user_id uuid)  
SET search_path TO 'public';

ALTER FUNCTION public.get_user_id_from_client_id(client_uuid uuid)
SET search_path TO 'public';

ALTER FUNCTION public.get_client_id_from_user_id(user_uuid uuid)
SET search_path TO 'public';

-- 2. Update auth configuration for better security
UPDATE auth.config SET
  otp_exp = 300,  -- 5 minutes instead of default longer time
  enable_leaked_password_protection = true;