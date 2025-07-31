-- STEP 4: Update remaining RLS policies for other tables

-- ASSESSMENT_FORM_ASSIGNMENTS policies  
DROP POLICY IF EXISTS "Users can manage form assignments for their clients" ON assessment_form_assignments;
DROP POLICY IF EXISTS "Clients can view their form assignments by email" ON assessment_form_assignments;

CREATE POLICY "Users can view their own form assignments" ON assessment_form_assignments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own form assignments" ON assessment_form_assignments
  FOR ALL USING (auth.uid() = user_id);

-- ASSESSMENT_ROUNDS policies
DROP POLICY IF EXISTS "Users can view assessments for their clients" ON assessment_rounds;  
DROP POLICY IF EXISTS "Users can create assessments for their clients" ON assessment_rounds;
DROP POLICY IF EXISTS "Clients can view their own assessments by email" ON assessment_rounds;
DROP POLICY IF EXISTS "Clients can create their own assessments by email" ON assessment_rounds;

CREATE POLICY "Users can view their own assessments" ON assessment_rounds
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assessments" ON assessment_rounds
  FOR INSERT WITH CHECK (auth.uid() = user_id AND created_by = auth.uid());

-- PILLAR_ASSESSMENTS policies
DROP POLICY IF EXISTS "Users can manage assessments for their clients" ON pillar_assessments;
DROP POLICY IF EXISTS "Clients can manage their own assessments by email" ON pillar_assessments;

CREATE POLICY "Users can view their own pillar assessments" ON pillar_assessments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own pillar assessments" ON pillar_assessments
  FOR ALL USING (auth.uid() = user_id);

-- CALENDAR_EVENTS policies
DROP POLICY IF EXISTS "Users can manage events for their clients" ON calendar_events;
DROP POLICY IF EXISTS "Clients can view their own events" ON calendar_events;

CREATE POLICY "Users can view their own calendar events" ON calendar_events
  FOR SELECT USING (auth.uid() = user_id OR visible_to_client = true);

CREATE POLICY "Users can manage their own calendar events" ON calendar_events
  FOR ALL USING (auth.uid() = user_id);