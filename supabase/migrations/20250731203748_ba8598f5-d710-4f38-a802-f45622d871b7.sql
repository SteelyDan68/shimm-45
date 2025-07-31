-- STEP 3: Update all RLS policies to use user_id instead of client_id
-- We need to update policies before dropping client_id columns

-- Drop existing policies that depend on client_id and recreate with user_id

-- PATH_ENTRIES policies
DROP POLICY IF EXISTS "Users can view path entries for their clients" ON path_entries;
DROP POLICY IF EXISTS "Users can update path entries for their clients" ON path_entries;
DROP POLICY IF EXISTS "Users can delete path entries for their clients" ON path_entries;
DROP POLICY IF EXISTS "Clients can view their own path entries by email" ON path_entries;
DROP POLICY IF EXISTS "Users can create path entries for their own client profile" ON path_entries;

-- New path_entries policies using user_id directly
CREATE POLICY "Users can view their own path entries" ON path_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own path entries" ON path_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own path entries" ON path_entries
  FOR UPDATE USING (auth.uid() = user_id AND created_by = auth.uid());

CREATE POLICY "Users can delete their own path entries" ON path_entries
  FOR DELETE USING (auth.uid() = user_id AND created_by = auth.uid());

CREATE POLICY "Admins can manage all path entries" ON path_entries
  FOR ALL USING (is_admin(auth.uid()));

-- TASKS policies
DROP POLICY IF EXISTS "Users can view tasks for their clients" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks for their clients" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks for their clients" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks for their clients" ON tasks;
DROP POLICY IF EXISTS "Clients can view their own tasks by email" ON tasks;
DROP POLICY IF EXISTS "Clients can update their own tasks by email" ON tasks;

-- New tasks policies using user_id directly
CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id AND created_by = auth.uid());

CREATE POLICY "Admins can manage all tasks" ON tasks
  FOR ALL USING (is_admin(auth.uid()));