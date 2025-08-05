-- SLUTFÖR ATTRIBUT-SYSTEMET: Lägg till hjälpfunktioner som saknas

-- Uppdatera has_role för nya strukturen
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_attributes 
    WHERE user_id = _user_id 
      AND attribute_key LIKE 'role_%'
      AND attribute_value = to_jsonb(_role::text)
      AND is_active = true
  );
$$;

-- Lägg till funktion för att hämta alla roller för en användare
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS SETOF text
LANGUAGE sql
STABLE SECURITY DEFINER  
SET search_path TO 'public'
AS $$
  SELECT attribute_value #>> '{}' as role
  FROM public.user_attributes
  WHERE user_id = _user_id 
    AND attribute_key LIKE 'role_%'
    AND is_active = true;
$$;

-- Lägg till funktion för att sätta roller
CREATE OR REPLACE FUNCTION public.set_user_role(_user_id uuid, _role app_role)
RETURNS void
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
    'role_' || _role::text,
    to_jsonb(_role::text),
    'role',
    auth.uid()
  )
  ON CONFLICT (user_id, attribute_key) 
  DO UPDATE SET 
    attribute_value = EXCLUDED.attribute_value,
    updated_at = now(),
    is_active = true;
END;
$$;