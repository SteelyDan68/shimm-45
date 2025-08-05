-- FIXA FUNKTIONER FÖR ATTRIBUT-SYSTEMET

-- Ta bort och återskapa get_user_roles
DROP FUNCTION IF EXISTS public.get_user_roles(uuid);

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