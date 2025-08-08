-- Create development_strategies table for live functionality
CREATE TABLE IF NOT EXISTS public.development_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pillar_key TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('habit', 'action', 'mindset', 'skill')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_time INTEGER NOT NULL DEFAULT 5,
  difficulty_level INTEGER NOT NULL CHECK (difficulty_level BETWEEN 1 AND 5),
  neuroplastic_principle TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.development_strategies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own development strategies"
ON public.development_strategies
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_development_strategies_updated_at
BEFORE UPDATE ON public.development_strategies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create personal_development_plans table
CREATE TABLE IF NOT EXISTS public.personal_development_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Min Utvecklingsplan',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  focus_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_from_assessments JSONB DEFAULT '[]'::jsonb,
  ai_analysis TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.personal_development_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own development plans"
ON public.personal_development_plans
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_personal_development_plans_updated_at
BEFORE UPDATE ON public.personal_development_plans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create assessment_detailed_analyses table for full AI-generated content
CREATE TABLE IF NOT EXISTS public.assessment_detailed_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_round_id UUID NOT NULL,
  user_id UUID NOT NULL,
  pillar_type TEXT NOT NULL,
  full_analysis TEXT NOT NULL,
  executive_summary TEXT NOT NULL,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  insights JSONB NOT NULL DEFAULT '[]'::jsonb,
  action_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.assessment_detailed_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own detailed analyses"
ON public.assessment_detailed_analyses
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_assessment_detailed_analyses_updated_at
BEFORE UPDATE ON public.assessment_detailed_analyses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();