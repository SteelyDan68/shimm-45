-- KRITISK FIX: Reparera felaktig logging-funktion som blockerar profil-skapning

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

-- Uppdatera log_sensitive_data_access för att hantera alla tabeller korrekt
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Logga endast om det finns en autentiserad användare
  IF auth.uid() IS NOT NULL THEN
    PERFORM public.log_security_event(
      'sensitive_data_access',
      jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'operation', TG_OP,
        'timestamp', NOW()
      )
    );
  END IF;
  
  -- Returnera rätt värde baserat på operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;