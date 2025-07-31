-- STEP 5: Update policies for remaining tables and drop client_id columns

-- CLIENT_DATA_CONTAINERS policies
DROP POLICY IF EXISTS "Users can manage containers for their clients" ON client_data_containers;
DROP POLICY IF EXISTS "Clients can view their own containers by email" ON client_data_containers;

CREATE POLICY "Users can view their own data containers" ON client_data_containers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own data containers" ON client_data_containers
  FOR ALL USING (auth.uid() = user_id);

-- CLIENT_DATA_CACHE policies  
DROP POLICY IF EXISTS "Users can view cache for their clients" ON client_data_cache;
DROP POLICY IF EXISTS "Users can insert cache for their clients" ON client_data_cache;

CREATE POLICY "Users can view their own data cache" ON client_data_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own data cache" ON client_data_cache
  FOR ALL USING (auth.uid() = user_id);

-- PILLAR_VISUALIZATION_DATA policies
DROP POLICY IF EXISTS "Users can view visualization data for their clients" ON pillar_visualization_data;
DROP POLICY IF EXISTS "Clients can view their own visualization data by email" ON pillar_visualization_data;

CREATE POLICY "Users can view their own visualization data" ON pillar_visualization_data
  FOR SELECT USING (auth.uid() = user_id);