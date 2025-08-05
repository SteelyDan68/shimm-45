-- Remove client table references and implement user_id-centered system
-- This follows the "single source of truth" principle where everything centers around user_id

-- 1. Drop functions that reference non-existent clients table
DROP FUNCTION IF EXISTS public.get_client_id_from_user_id(uuid);
DROP FUNCTION IF EXISTS public.get_user_id_from_client_id(uuid);

-- 2. Create user attributes table for flexible properties/roles
CREATE TABLE IF NOT EXISTS public.user_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attribute_key text NOT NULL,
  attribute_value jsonb NOT NULL DEFAULT '{}',
  attribute_type text NOT NULL DEFAULT 'property', -- 'role', 'property', 'config', 'metadata'
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  
  UNIQUE(user_id, attribute_key)
);

-- Enable RLS
ALTER TABLE public.user_attributes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_attributes
CREATE POLICY "Users can view their own attributes"
ON public.user_attributes
FOR SELECT
USING (auth.uid() = user_id);

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

-- Create indexes for performance
CREATE INDEX idx_user_attributes_user_id ON public.user_attributes(user_id);
CREATE INDEX idx_user_attributes_key ON public.user_attributes(attribute_key);
CREATE INDEX idx_user_attributes_type ON public.user_attributes(attribute_type);
CREATE INDEX idx_user_attributes_active ON public.user_attributes(is_active);

-- Create updated_at trigger
CREATE TRIGGER update_user_attributes_updated_at
  BEFORE UPDATE ON public.user_attributes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Create helper functions for user attributes
CREATE OR REPLACE FUNCTION public.get_user_attribute(
  _user_id uuid, 
  _attribute_key text
) RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT attribute_value 
  FROM public.user_attributes 
  WHERE user_id = _user_id 
    AND attribute_key = _attribute_key 
    AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.set_user_attribute(
  _user_id uuid,
  _attribute_key text,
  _attribute_value jsonb,
  _attribute_type text DEFAULT 'property'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_attributes (
    user_id, 
    attribute_key, 
    attribute_value, 
    attribute_type,
    created_by
  )
  VALUES (
    _user_id, 
    _attribute_key, 
    _attribute_value, 
    _attribute_type,
    auth.uid()
  )
  ON CONFLICT (user_id, attribute_key) 
  DO UPDATE SET 
    attribute_value = _attribute_value,
    attribute_type = _attribute_type,
    updated_at = now(),
    is_active = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_user_attribute(
  _user_id uuid,
  _attribute_key text,
  _attribute_value jsonb DEFAULT NULL
) RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_attributes 
    WHERE user_id = _user_id 
      AND attribute_key = _attribute_key 
      AND is_active = true
      AND (
        _attribute_value IS NULL 
        OR attribute_value = _attribute_value
      )
  );
$$;

-- 4. Create function to get users by attribute
CREATE OR REPLACE FUNCTION public.get_users_with_attribute(
  _attribute_key text,
  _attribute_value jsonb DEFAULT NULL
) RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT user_id 
  FROM public.user_attributes 
  WHERE attribute_key = _attribute_key 
    AND is_active = true
    AND (
      _attribute_value IS NULL 
      OR attribute_value = _attribute_value
    );
$$;

-- 5. Helper function to check if user has client context
CREATE OR REPLACE FUNCTION public.user_has_client_context(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (
    -- User has client role
    public.has_role(_user_id, 'client') OR
    -- User has client attribute
    public.has_user_attribute(_user_id, 'context', '"client"'::jsonb)
  );
$$;