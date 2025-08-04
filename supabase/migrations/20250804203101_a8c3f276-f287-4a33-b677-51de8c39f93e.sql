-- Skapa RLS Policies för Stefan AI tabeller

-- Stefan Memory Policies
CREATE POLICY "stefan_memory_user_access" 
ON public.stefan_memory FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "stefan_memory_system_management" 
ON public.stefan_memory FOR ALL 
WITH CHECK (true);

-- Stefan Analytics Policies
CREATE POLICY "stefan_analytics_user_access" 
ON public.stefan_analytics FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "stefan_analytics_system_insert" 
ON public.stefan_analytics FOR INSERT 
WITH CHECK (true);

CREATE POLICY "stefan_analytics_admin_access" 
ON public.stefan_analytics FOR SELECT 
USING (is_admin(auth.uid()));

-- AI Service Logs Policies
CREATE POLICY "ai_logs_system_management" 
ON public.ai_service_logs FOR ALL 
WITH CHECK (true);

CREATE POLICY "ai_logs_admin_access" 
ON public.ai_service_logs FOR SELECT 
USING (is_admin(auth.uid()));

-- Neuroplasticity Progress Policies
CREATE POLICY "neuroplasticity_user_access" 
ON public.neuroplasticity_progress FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "neuroplasticity_system_management" 
ON public.neuroplasticity_progress FOR ALL 
WITH CHECK (true);

-- Stefan AI Config Policies
CREATE POLICY "stefan_config_admin_management" 
ON public.stefan_ai_config FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "stefan_config_public_read" 
ON public.stefan_ai_config FOR SELECT 
USING (is_active = true);

-- Proactive Interventions Policies
CREATE POLICY "interventions_user_read" 
ON public.proactive_interventions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "interventions_user_update" 
ON public.proactive_interventions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "interventions_system_management" 
ON public.proactive_interventions FOR ALL 
WITH CHECK (true);