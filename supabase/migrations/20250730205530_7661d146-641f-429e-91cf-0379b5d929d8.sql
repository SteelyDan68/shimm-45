-- Fix security definer functions by setting search_path
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate a random token
  token := encode(gen_random_bytes(32), 'base64url');
  
  -- Ensure it's unique
  WHILE EXISTS (SELECT 1 FROM public.invitations WHERE token = token) LOOP
    token := encode(gen_random_bytes(32), 'base64url');
  END LOOP;
  
  RETURN token;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_invitation_token(invitation_token TEXT)
RETURNS TABLE (
  invitation_id UUID,
  email TEXT,
  invited_role TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.email,
    i.invited_role,
    i.expires_at,
    (i.status = 'pending' AND i.expires_at > now()) as is_valid
  FROM public.invitations i
  WHERE i.token = invitation_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_invitation_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.token IS NULL OR NEW.token = '' THEN
    NEW.token := public.generate_invitation_token();
  END IF;
  RETURN NEW;
END;
$$;