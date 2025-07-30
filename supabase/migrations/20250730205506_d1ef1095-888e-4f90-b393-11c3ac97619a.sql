-- Create invitations table
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invited_role TEXT NOT NULL DEFAULT 'client',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  UNIQUE(email, status) -- Prevent multiple pending invitations for same email
);

-- Enable Row Level Security
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for invitations
CREATE POLICY "Admins can manage all invitations" 
ON public.invitations 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view invitations they sent" 
ON public.invitations 
FOR SELECT 
USING (auth.uid() = invited_by);

CREATE POLICY "Users can create invitations" 
ON public.invitations 
FOR INSERT 
WITH CHECK (auth.uid() = invited_by);

-- Create function to generate unique invitation tokens
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create function to validate invitation token
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

-- Create trigger to automatically generate token on insert
CREATE OR REPLACE FUNCTION public.set_invitation_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.token IS NULL OR NEW.token = '' THEN
    NEW.token := public.generate_invitation_token();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_invitation_token
  BEFORE INSERT ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_invitation_token();