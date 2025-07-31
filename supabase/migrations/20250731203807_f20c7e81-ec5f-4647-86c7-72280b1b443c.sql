-- STEP 3 (fixed): Update RLS policies to use user_id instead of client_id
-- Only create policies that don't already exist

-- PATH_ENTRIES policies (only create new user-based ones)
CREATE POLICY "Users can view their own path entries" ON path_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own path entries" ON path_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own path entries" ON path_entries
  FOR UPDATE USING (auth.uid() = user_id AND created_by = auth.uid());

CREATE POLICY "Users can delete their own path entries" ON path_entries
  FOR DELETE USING (auth.uid() = user_id AND created_by = auth.uid());

-- TASKS policies (only create new user-based ones)
CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id AND created_by = auth.uid());