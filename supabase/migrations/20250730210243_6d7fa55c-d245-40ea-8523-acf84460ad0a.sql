-- Fix the generate_invitation_token function to use crypto extension
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate a random token using crypto extension
  token := encode(crypto.digest(random()::text || clock_timestamp()::text, 'sha256'), 'base64');
  -- Remove padding and make URL safe
  token := replace(replace(replace(token, '+', '-'), '/', '_'), '=', '');
  -- Ensure it's unique
  WHILE EXISTS (SELECT 1 FROM public.invitations WHERE token = token) LOOP
    token := encode(crypto.digest(random()::text || clock_timestamp()::text, 'sha256'), 'base64');
    token := replace(replace(replace(token, '+', '-'), '/', '_'), '=', '');
  END LOOP;
  
  RETURN token;
END;
$$;