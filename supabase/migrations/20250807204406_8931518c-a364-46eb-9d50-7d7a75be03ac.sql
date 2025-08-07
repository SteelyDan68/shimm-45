-- 🔒 FAS 4: ONGOING SECURITY MONITORING & ALERTING
-- Implementera proaktiv säkerhetsmonitorering och alerting

-- 1. SÄKERHETSALERTER FÖR KRITISKA HÄNDELSER
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title text NOT NULL,
  description text NOT NULL,
  triggered_by_user_id uuid,
  target_user_id uuid,
  metadata jsonb DEFAULT '{}',
  resolved_at timestamp with time zone,
  resolved_by uuid,
  resolution_notes text,
  auto_resolved boolean DEFAULT false,
  triggered_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- Endast superadmins kan hantera säkerhetsalerter
CREATE POLICY "Only superadmins can manage security alerts"
  ON public.security_alerts
  FOR ALL
  USING (public.superadmin_god_mode(auth.uid()))
  WITH CHECK (public.superadmin_god_mode(auth.uid()));

-- 2. AUTOMATISK ALERTING FÖR ROLLTILLDELNINGAR
CREATE OR REPLACE FUNCTION public.monitor_role_assignments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  assigner_roles text[];
  alert_severity text;
  alert_description text;
BEGIN
  -- Hämta assigner's roller
  SELECT array_agg(role::text) INTO assigner_roles
  FROM public.user_roles
  WHERE user_id = auth.uid();
  
  -- Bestäm alert severity baserat på tilldelad roll
  alert_severity := CASE 
    WHEN NEW.role IN ('superadmin', 'admin') THEN 'critical'
    WHEN NEW.role = 'coach' THEN 'high'
    ELSE 'medium'
  END;
  
  -- Skapa alert för administrativa rolltilldelningar
  IF NEW.role IN ('superadmin', 'admin', 'coach') THEN
    alert_description := format(
      'Användare %s tilldelades rollen %s av %s (%s)',
      NEW.user_id,
      NEW.role,
      auth.uid(),
      array_to_string(assigner_roles, ', ')
    );
    
    INSERT INTO public.security_alerts (
      alert_type,
      severity,
      title,
      description,
      triggered_by_user_id,
      target_user_id,
      metadata
    ) VALUES (
      'role_assignment',
      alert_severity,
      'Administrativ rolltilldelning',
      alert_description,
      auth.uid(),
      NEW.user_id,
      jsonb_build_object(
        'assigned_role', NEW.role,
        'assigner_roles', assigner_roles,
        'assignment_timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Lägg till trigger för role monitoring
DROP TRIGGER IF EXISTS monitor_role_assignments_trigger ON public.user_roles;
CREATE TRIGGER monitor_role_assignments_trigger
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.monitor_role_assignments();

-- 3. SÄKERHETSVIOLATION MONITORING
CREATE OR REPLACE FUNCTION public.monitor_security_violations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  violation_count integer;
  alert_severity text;
BEGIN
  -- Räkna säkerhetsviolations från samma användare senaste timmen
  SELECT COUNT(*) INTO violation_count
  FROM public.edge_function_security_logs
  WHERE user_id = NEW.user_id
    AND authorization_success = false
    AND timestamp > now() - interval '1 hour';
  
  -- Bestäm severity baserat på antal violations
  alert_severity := CASE 
    WHEN violation_count >= 10 THEN 'critical'
    WHEN violation_count >= 5 THEN 'high'
    WHEN violation_count >= 3 THEN 'medium'
    ELSE 'low'
  END;
  
  -- Skapa alert vid upprepad säkerhetsviolations
  IF violation_count >= 3 THEN
    INSERT INTO public.security_alerts (
      alert_type,
      severity,
      title,
      description,
      triggered_by_user_id,
      target_user_id,
      metadata
    ) VALUES (
      'repeated_security_violations',
      alert_severity,
      'Upprepade säkerhetsviolations',
      format('Användare %s har %s säkerhetsviolations senaste timmen', NEW.user_id, violation_count),
      NEW.user_id,
      NEW.user_id,
      jsonb_build_object(
        'violation_count', violation_count,
        'time_window', '1 hour',
        'latest_violation_type', NEW.security_violation_type,
        'function_name', NEW.function_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Lägg till trigger för security violation monitoring
DROP TRIGGER IF EXISTS monitor_security_violations_trigger ON public.edge_function_security_logs;
CREATE TRIGGER monitor_security_violations_trigger
  AFTER INSERT ON public.edge_function_security_logs
  FOR EACH ROW
  WHEN (NEW.authorization_success = false)
  EXECUTE FUNCTION public.monitor_security_violations();

-- 4. ADMIN PRIVILEGE ESCALATION MONITORING
CREATE OR REPLACE FUNCTION public.monitor_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  is_self_assignment boolean;
  alert_description text;
BEGIN
  -- Kontrollera om detta är self-assignment av admin-roller
  is_self_assignment := (auth.uid() = NEW.user_id);
  
  -- Skapa KRITISK alert för self-assignment av admin-roller
  IF is_self_assignment AND NEW.role IN ('admin', 'superadmin') THEN
    alert_description := format(
      'KRITISK SÄKERHETSVARNING: Användare %s försökte tilldela sig själv rollen %s',
      NEW.user_id,
      NEW.role
    );
    
    INSERT INTO public.security_alerts (
      alert_type,
      severity,
      title,
      description,
      triggered_by_user_id,
      target_user_id,
      metadata
    ) VALUES (
      'privilege_escalation_attempt',
      'critical',
      'Privilege Escalation Försök',
      alert_description,
      NEW.user_id,
      NEW.user_id,
      jsonb_build_object(
        'attempted_role', NEW.role,
        'self_assignment', is_self_assignment,
        'blocked_by_trigger', true,
        'security_timestamp', now()
      )
    );
    
    -- Blockera försöket genom att kasta exception
    RAISE EXCEPTION 'SECURITY VIOLATION: Self-assignment of administrative roles blocked. Incident logged.';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Lägg till trigger för privilege escalation monitoring
DROP TRIGGER IF EXISTS monitor_privilege_escalation_trigger ON public.user_roles;
CREATE TRIGGER monitor_privilege_escalation_trigger
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.monitor_privilege_escalation();

-- 5. SÄKERHETSAUDIT FUNKTIONER
CREATE OR REPLACE FUNCTION public.get_security_dashboard_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  metrics jsonb;
  total_users integer;
  admin_count integer;
  recent_violations integer;
  unresolved_alerts integer;
  critical_alerts integer;
BEGIN
  -- Samla säkerhetsmetriker
  SELECT COUNT(*) INTO total_users FROM public.profiles WHERE is_active = true;
  
  SELECT COUNT(DISTINCT user_id) INTO admin_count 
  FROM public.user_roles 
  WHERE role IN ('admin', 'superadmin');
  
  SELECT COUNT(*) INTO recent_violations
  FROM public.edge_function_security_logs
  WHERE authorization_success = false
    AND timestamp > now() - interval '24 hours';
  
  SELECT COUNT(*) INTO unresolved_alerts
  FROM public.security_alerts
  WHERE resolved_at IS NULL;
  
  SELECT COUNT(*) INTO critical_alerts
  FROM public.security_alerts
  WHERE severity = 'critical'
    AND resolved_at IS NULL;
  
  -- Bygg metrics objekt
  metrics := jsonb_build_object(
    'total_users', total_users,
    'admin_count', admin_count,
    'recent_violations_24h', recent_violations,
    'unresolved_alerts', unresolved_alerts,
    'critical_alerts', critical_alerts,
    'security_score', CASE 
      WHEN critical_alerts = 0 AND recent_violations < 5 THEN 'excellent'
      WHEN critical_alerts = 0 AND recent_violations < 20 THEN 'good'
      WHEN critical_alerts <= 2 AND recent_violations < 50 THEN 'fair'
      ELSE 'poor'
    END,
    'last_updated', now()
  );
  
  RETURN metrics;
END;
$function$;