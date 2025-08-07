-- 🔒 KRITISKA SÄKERHETSFIXAR - PHASE 1: PRIVILEGE ESCALATION PREVENTION
-- Fixing critical security vulnerabilities identified by linter and manual review

-- 1. KRITISK FIX: Förhindra privilegie-eskalering via user_roles self-assignment
-- Stärk RLS policies för user_roles tabellen

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmin god mode - user_roles" ON public.user_roles;

-- Skapa säkra RLS policies som förhindrar self-assignment
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can assign roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    -- Endast admins kan tilldela roller
    (public.is_admin(auth.uid()) OR public.superadmin_god_mode(auth.uid()))
    AND
    -- Extra validering: förhindra self-assignment av admin/superadmin roller
    NOT (
      auth.uid() = user_id 
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Only admins can modify roles"
  ON public.user_roles
  FOR UPDATE
  USING (
    public.is_admin(auth.uid()) OR public.superadmin_god_mode(auth.uid())
  )
  WITH CHECK (
    (public.is_admin(auth.uid()) OR public.superadmin_god_mode(auth.uid()))
    AND
    -- Extra validering: förhindra self-assignment av admin/superadmin roller
    NOT (
      auth.uid() = user_id 
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles
  FOR DELETE
  USING (
    public.is_admin(auth.uid()) OR public.superadmin_god_mode(auth.uid())
  );

-- Superadmin god mode policy (behåll för säkerhet)
CREATE POLICY "Superadmin god mode - user_roles"
  ON public.user_roles
  FOR ALL
  USING (public.superadmin_god_mode(auth.uid()))
  WITH CHECK (public.superadmin_god_mode(auth.uid()));

-- 2. TRIGGER FÖR SERVER-SIDE VALIDERING AV ROLLTILLDELNINGAR
CREATE OR REPLACE FUNCTION public.validate_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  assigner_is_admin boolean := false;
  is_self_assignment boolean := false;
  current_user_id uuid;
BEGIN
  -- Hämta current user ID
  current_user_id := auth.uid();
  
  -- Om ingen användare är inloggad, tillåt endast system operations
  IF current_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Kontrollera om den som tilldelar är admin
  SELECT public.is_admin(current_user_id) OR public.superadmin_god_mode(current_user_id) 
  INTO assigner_is_admin;
  
  -- Kontrollera om det är self-assignment
  is_self_assignment := (current_user_id = NEW.user_id);
  
  -- Förhindra self-assignment av admin/superadmin roller
  IF is_self_assignment AND NEW.role IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Self-assignment of administrative roles is not permitted';
  END IF;
  
  -- Endast admins kan tilldela roller över 'client'
  IF NOT assigner_is_admin AND NEW.role != 'client' THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Only administrators can assign non-client roles';
  END IF;
  
  -- Logga rolltilldelning för audit (endast om användare är inloggad)
  IF current_user_id IS NOT NULL THEN
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action,
      target_user_id,
      details
    ) VALUES (
      current_user_id,
      'role_assignment',
      NEW.user_id,
      jsonb_build_object(
        'role', NEW.role,
        'assigned_by', current_user_id,
        'self_assignment', is_self_assignment,
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Lägg till trigger
DROP TRIGGER IF EXISTS validate_role_assignment_trigger ON public.user_roles;
CREATE TRIGGER validate_role_assignment_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_assignment();

-- 3. FIX SEARCH PATH VULNERABILITIES för kritiska funktioner
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'superadmin')
  )
$function$;

CREATE OR REPLACE FUNCTION public.superadmin_god_mode(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'superadmin'
  )
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- 4. FÖRBÄTTRA ADMIN PASSWORD RESET SÄKERHET
CREATE OR REPLACE FUNCTION public.validate_admin_action(_user_id uuid, _action text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  is_admin_user boolean := false;
  user_roles text[];
  result jsonb;
BEGIN
  -- Hämta användarens roller
  SELECT array_agg(role::text) INTO user_roles
  FROM public.user_roles
  WHERE user_id = _user_id;
  
  -- Kontrollera admin-behörighet
  is_admin_user := (
    'admin' = ANY(user_roles) OR 
    'superadmin' = ANY(user_roles)
  );
  
  -- Bygg resultat
  result := jsonb_build_object(
    'is_admin', is_admin_user,
    'user_id', _user_id,
    'action', _action,
    'roles', user_roles,
    'validated_at', now()
  );
  
  -- Logga admin-åtgärd (endast om användare är inloggad)
  IF _user_id IS NOT NULL THEN
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action,
      details
    ) VALUES (
      _user_id,
      _action || '_validation',
      result
    );
  END IF;
  
  RETURN result;
END;
$function$;