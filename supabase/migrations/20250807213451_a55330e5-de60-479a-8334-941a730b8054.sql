-- Create coach messaging permissions table
CREATE TABLE IF NOT EXISTS public.coach_messaging_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  enabled_by UUID REFERENCES profiles(id),
  enabled_at TIMESTAMP WITH TIME ZONE,
  disabled_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, coach_id)
);

-- Enable Row Level Security
ALTER TABLE public.coach_messaging_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage coach messaging permissions" 
ON public.coach_messaging_permissions 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Coaches can view their messaging permissions" 
ON public.coach_messaging_permissions 
FOR SELECT 
USING (auth.uid() = coach_id OR auth.uid() = client_id);

-- Create trigger for updated_at
CREATE TRIGGER update_coach_messaging_permissions_updated_at
BEFORE UPDATE ON public.coach_messaging_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_coaching_updated_at();