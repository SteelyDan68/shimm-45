-- Sprint 1: Stefan AI Messaging System Database Schema
-- Creates proper tables for Stefan interventions and removes mock data dependency

-- Create Stefan interventions table for tracking all proactive interactions
CREATE TABLE public.stefan_interventions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  intervention_type TEXT NOT NULL DEFAULT 'proactive_message',
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  context_data JSONB NOT NULL DEFAULT '{}',
  ai_analysis JSONB DEFAULT NULL,
  user_responded BOOLEAN DEFAULT FALSE,
  user_response TEXT DEFAULT NULL,
  response_sentiment TEXT DEFAULT NULL,
  effectiveness_score NUMERIC DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stefan_interventions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for Stefan interventions
CREATE POLICY "Users can view their own Stefan interventions"
ON public.stefan_interventions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create Stefan interventions"
ON public.stefan_interventions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update responses to their interventions"
ON public.stefan_interventions 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all Stefan interventions"
ON public.stefan_interventions 
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create Stefan behavior analytics table
CREATE TABLE public.stefan_behavior_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  behavior_patterns JSONB NOT NULL DEFAULT '{}',
  insights JSONB NOT NULL DEFAULT '{}',
  recommendations JSONB NOT NULL DEFAULT '{}',
  pillar_correlations JSONB DEFAULT NULL,
  assessment_integration JSONB DEFAULT NULL,
  confidence_score NUMERIC DEFAULT 0.5,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stefan_behavior_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for behavior analytics
CREATE POLICY "Users can view their own behavior analytics"
ON public.stefan_behavior_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create behavior analytics"
ON public.stefan_behavior_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage all behavior analytics"
ON public.stefan_behavior_analytics 
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_stefan_interventions_user_id ON public.stefan_interventions(user_id);
CREATE INDEX idx_stefan_interventions_trigger_type ON public.stefan_interventions(trigger_type);
CREATE INDEX idx_stefan_interventions_created_at ON public.stefan_interventions(created_at DESC);
CREATE INDEX idx_stefan_interventions_user_responded ON public.stefan_interventions(user_responded);

CREATE INDEX idx_stefan_behavior_analytics_user_id ON public.stefan_behavior_analytics(user_id);
CREATE INDEX idx_stefan_behavior_analytics_analysis_type ON public.stefan_behavior_analytics(analysis_type);
CREATE INDEX idx_stefan_behavior_analytics_active ON public.stefan_behavior_analytics(is_active) WHERE is_active = true;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_stefan_interventions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_stefan_interventions_updated_at
BEFORE UPDATE ON public.stefan_interventions
FOR EACH ROW
EXECUTE FUNCTION public.update_stefan_interventions_updated_at();

-- Insert some example trigger types for reference
INSERT INTO public.stefan_interventions (user_id, trigger_type, content, priority, context_data) VALUES
('00000000-0000-0000-0000-000000000001', 'system_initialized', 'Stefan AI coaching system har aktiverats för användaren', 'low', '{"initial_setup": true}');

-- Create view for Stefan intervention analytics
CREATE OR REPLACE VIEW public.stefan_intervention_summary AS
SELECT 
  user_id,
  COUNT(*) as total_interventions,
  COUNT(*) FILTER (WHERE user_responded = true) as responded_interventions,
  ROUND(
    (COUNT(*) FILTER (WHERE user_responded = true)::numeric / COUNT(*)::numeric) * 100, 2
  ) as response_rate_percent,
  AVG(effectiveness_score) as avg_effectiveness_score,
  COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_interventions,
  COUNT(*) FILTER (WHERE priority = 'high') as high_priority_interventions,
  DATE_TRUNC('day', MAX(created_at)) as last_intervention_date,
  DATE_TRUNC('day', MIN(created_at)) as first_intervention_date
FROM public.stefan_interventions
GROUP BY user_id;