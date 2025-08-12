-- Dropp och återskapa funktionen för att fixa parametern
DROP FUNCTION IF EXISTS public.log_security_event(text, jsonb);

CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  event_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Logga säkerhetshändelser utan att orsaka fel
  BEGIN
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action,
      details,
      created_at
    ) VALUES (
      auth.uid(),
      event_type,
      event_data,
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Ignorera fel i loggning för att inte stoppa huvudoperationen
    NULL;
  END;
END;
$$;

-- Nu skapa profilen för test14@shimms.com
INSERT INTO public.profiles (
  id, 
  email, 
  first_name, 
  last_name, 
  created_at, 
  updated_at,
  is_active
) VALUES (
  'bc54ee63-c086-4a57-b66d-29b6da9753d3',
  'test14@shimms.com',
  '',
  '',
  NOW(),
  NOW(),
  true
) ON CONFLICT (id) DO NOTHING;