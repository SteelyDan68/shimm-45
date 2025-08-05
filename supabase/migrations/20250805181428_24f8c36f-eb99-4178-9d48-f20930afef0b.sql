-- Fix critical security issue: Add RLS policies for pillar tables that are still referenced by legacy code

-- RLS policies for user_pillar_activations 
CREATE POLICY "Users can manage their own pillar activations" 
ON public.user_pillar_activations 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all pillar activations" 
ON public.user_pillar_activations 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- RLS policies for pillar_assessments
CREATE POLICY "Users can manage their own pillar assessments" 
ON public.pillar_assessments 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all pillar assessments" 
ON public.pillar_assessments 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- RLS policies for pillar_visualization_data
CREATE POLICY "Users can manage their own pillar visualization data" 
ON public.pillar_visualization_data 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all pillar visualization data" 
ON public.pillar_visualization_data 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));