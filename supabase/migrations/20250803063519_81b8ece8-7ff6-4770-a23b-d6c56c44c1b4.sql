-- Fix critical security issues found by linter (corrected)

-- 1. Fix function search paths for security
ALTER FUNCTION public.is_organization_member(_user_id uuid, _organization_id uuid)
SET search_path TO 'public';

ALTER FUNCTION public.get_user_organization_ids(_user_id uuid)  
SET search_path TO 'public';

ALTER FUNCTION public.get_user_id_from_client_id(client_uuid uuid)
SET search_path TO 'public';

ALTER FUNCTION public.get_client_id_from_user_id(user_uuid uuid)
SET search_path TO 'public';

-- Note: Auth configuration must be done through Supabase dashboard
-- OTP expiry and leaked password protection requires manual configuration