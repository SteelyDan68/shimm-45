-- Create Welcome Assessment table
CREATE TABLE public.welcome_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wheel_of_life_scores JSONB NOT NULL DEFAULT '{}',
  adaptive_questions JSONB NOT NULL DEFAULT '{}',
  free_text_responses JSONB NOT NULL DEFAULT '{}',
  quick_wins JSONB NOT NULL DEFAULT '{}',
  overall_score NUMERIC,
  ai_analysis TEXT,
  recommendations JSONB DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.welcome_assessments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own welcome assessments" 
ON public.welcome_assessments 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all welcome assessments" 
ON public.welcome_assessments 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create Stefan interactions table
CREATE TABLE public.stefan_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  interaction_type TEXT NOT NULL,
  stefan_persona TEXT NOT NULL DEFAULT 'mentor',
  context_data JSONB DEFAULT '{}',
  message_content TEXT,
  user_response TEXT,
  ai_analysis TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stefan_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own Stefan interactions" 
ON public.stefan_interactions 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all Stefan interactions" 
ON public.stefan_interactions 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Create user journey state table
CREATE TABLE public.user_journey_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_phase TEXT NOT NULL DEFAULT 'welcome',
  completed_assessments JSONB DEFAULT '[]',
  next_recommended_assessment TEXT,
  journey_progress NUMERIC DEFAULT 0,
  stefan_interventions_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_journey_states ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own journey state" 
ON public.user_journey_states 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all journey states" 
ON public.user_journey_states 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_welcome_assessments_updated_at
BEFORE UPDATE ON public.welcome_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_journey_states_updated_at
BEFORE UPDATE ON public.user_journey_states
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();