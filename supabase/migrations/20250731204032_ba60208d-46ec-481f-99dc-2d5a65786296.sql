-- STEP 9: Handle remaining tables with client_id references

-- Handle client_pillar_activations - this still uses client_id but in a different way
-- We need to migrate this table to work with user_id directly instead

-- Update client_pillar_activations policies to be user_id based
DROP POLICY IF EXISTS "Users can manage pillar activations for their clients" ON client_pillar_activations;
DROP POLICY IF EXISTS "Clients can view their pillar activations by email" ON client_pillar_activations;

-- Create new policies based on user_id directly
CREATE POLICY "Users can view their own pillar activations" ON client_pillar_activations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own pillar activations" ON client_pillar_activations  
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all pillar activations" ON client_pillar_activations
  FOR ALL USING (is_admin(auth.uid()));

-- Also update the client_pillar_assignments table
DROP POLICY IF EXISTS "Users can manage pillar assignments for their clients" ON client_pillar_assignments;
DROP POLICY IF EXISTS "Clients can view their pillar assignments by email" ON client_pillar_assignments;

CREATE POLICY "Users can view their own pillar assignments" ON client_pillar_assignments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own pillar assignments" ON client_pillar_assignments
  FOR ALL USING (auth.uid() = user_id);