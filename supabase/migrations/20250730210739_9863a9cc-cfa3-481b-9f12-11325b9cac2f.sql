-- Fix the column ambiguity in generate_invitation_token function
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  token_value TEXT;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  -- Generate a 32-character random token
  FOR i IN 1..32 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  
  token_value := result;
  
  -- Ensure it's unique by checking against the column explicitly
  WHILE EXISTS (SELECT 1 FROM public.invitations WHERE invitations.token = token_value) LOOP
    result := '';
    FOR i IN 1..32 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    token_value := result;
  END LOOP;
  
  RETURN token_value;
END;
$$;