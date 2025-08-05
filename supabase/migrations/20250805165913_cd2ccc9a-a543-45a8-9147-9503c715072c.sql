-- TOTAL REFAKTORERING: Single Source of Truth med user_attributes
-- Fäll 1: Skapa user_attributes tabellen
CREATE TABLE IF NOT EXISTS public.user_attributes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  attribute_key text NOT NULL,
  attribute_value jsonb NOT NULL,
  attribute_type text NOT NULL DEFAULT 'property',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE(user_id, attribute_key)
);

-- Enable RLS
ALTER TABLE public.user_attributes ENABLE ROW LEVEL SECURITY;

-- RLS Policies för user_attributes
CREATE POLICY "Users can manage their own attributes" 
ON public.user_attributes 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all attributes" 
ON public.user_attributes 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Superadmin god mode - user_attributes" 
ON public.user_attributes 
FOR ALL 
USING (superadmin_god_mode(auth.uid()))
WITH CHECK (superadmin_god_mode(auth.uid()));

-- Triggers för timestamps
CREATE TRIGGER update_user_attributes_updated_at
    BEFORE UPDATE ON public.user_attributes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Fäll 2: Migrera befintlig data från user_roles
INSERT INTO public.user_attributes (user_id, attribute_key, attribute_value, attribute_type, created_by)
SELECT 
  user_id,
  'role',
  to_jsonb(role::text),
  'role',
  user_id
FROM public.user_roles
ON CONFLICT (user_id, attribute_key) DO NOTHING;

-- Fäll 3: Migrera coach-client relationer
INSERT INTO public.user_attributes (user_id, attribute_key, attribute_value, attribute_type, created_by)
SELECT 
  coach_id,
  'coach_client_' || client_id::text,
  jsonb_build_object('client_id', client_id, 'assigned_at', assigned_at, 'is_active', is_active),
  'relationship',
  assigned_by
FROM public.coach_client_assignments
WHERE is_active = true
ON CONFLICT (user_id, attribute_key) DO NOTHING;

-- Fäll 4: Uppdatera befintliga hjälpfunktioner
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_attributes 
    WHERE user_id = _user_id 
      AND attribute_key = 'role'
      AND attribute_value = to_jsonb(_role::text)
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_client_context(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_attributes 
    WHERE user_id = _user_id 
      AND attribute_key = 'role'
      AND attribute_value = to_jsonb('client'::text)
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_coach_of_client(_coach_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_attributes 
    WHERE user_id = _coach_id 
      AND attribute_key = 'coach_client_' || _client_id::text
      AND is_active = true
  );
$$;