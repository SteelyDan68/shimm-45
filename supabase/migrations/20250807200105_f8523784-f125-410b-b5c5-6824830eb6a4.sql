-- PRIORITET 1: Konsolidera 'user' roll till 'client'
-- Uppdatera befintliga user-roller till client
UPDATE user_roles SET role = 'client' WHERE role = 'user';

-- Verifiera och förstärk coach-klient isolation policies
-- Skapa förbättrad RLS policy för assessment_rounds (coach isolation)
DROP POLICY IF EXISTS "Coaches can view assigned clients assessments" ON assessment_rounds;
CREATE POLICY "Coaches can view assigned clients assessments" 
ON assessment_rounds FOR SELECT
USING (
  auth.uid() = user_id OR
  is_admin(auth.uid()) OR 
  superadmin_god_mode(auth.uid()) OR
  is_coach_of_client(auth.uid(), user_id)
);

-- Förstärk coach_client_assignments policies
DROP POLICY IF EXISTS "Coaches can only see their assigned clients" ON coach_client_assignments;
CREATE POLICY "Coaches can only see their assigned clients"
ON coach_client_assignments FOR SELECT
USING (
  auth.uid() = coach_id OR 
  auth.uid() = client_id OR 
  is_admin(auth.uid()) OR 
  superadmin_god_mode(auth.uid())
);

-- Logga rollkonsolideringen
INSERT INTO admin_audit_log (
  admin_user_id,
  action,
  details
) VALUES (
  auth.uid(),
  'role_consolidation_user_to_client',
  jsonb_build_object(
    'description', 'Automated consolidation of user role to client role',
    'timestamp', now(),
    'priority', 'IMMEDIATE_ACTION'
  )
);