-- Fix the generate_invitation_token function using built-in functions
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  token TEXT;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  -- Generate a 32-character random token
  FOR i IN 1..32 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  
  token := result;
  
  -- Ensure it's unique
  WHILE EXISTS (SELECT 1 FROM public.invitations WHERE token = token) LOOP
    result := '';
    FOR i IN 1..32 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    token := result;
  END LOOP;
  
  RETURN token;
END;
$$;