-- Create modular pillar system tables
-- Drop old tables and create new modular structure

-- Create pillar definitions table (defines the 5 pillars)
CREATE TABLE public.pillar_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pillar_key TEXT NOT NULL UNIQUE CHECK (pillar_key IN ('self_care', 'skills', 'talent', 'brand', 'economy')),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color_code TEXT DEFAULT '#3B82F6',
  ai_prompt_template TEXT NOT NULL,
  scoring_weights JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pillar assignments (which pillars are active for each client)
CREATE TABLE public.client_pillar_activations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  pillar_key TEXT NOT NULL CHECK (pillar_key IN ('self_care', 'skills', 'talent', 'brand', 'economy')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  activated_by UUID NOT NULL,
  activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deactivated_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, pillar_key)
);

-- Create pillar assessments (separated by pillar)
CREATE TABLE public.pillar_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  pillar_key TEXT NOT NULL CHECK (pillar_key IN ('self_care', 'skills', 'talent', 'brand', 'economy')),
  assessment_data JSONB NOT NULL DEFAULT '{}', -- Contains all answers and scores
  calculated_score DECIMAL(4,2), -- 1-10 score for this pillar
  ai_analysis TEXT,
  insights JSONB DEFAULT '{}', -- Structured insights for visualizations
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pillar visualization data (for charts and trends)
CREATE TABLE public.pillar_visualization_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  pillar_key TEXT NOT NULL CHECK (pillar_key IN ('self_care', 'skills', 'talent', 'brand', 'economy')),
  data_type TEXT NOT NULL CHECK (data_type IN ('trend', 'breakdown', 'comparison', 'progress')),
  data_points JSONB NOT NULL DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pillar_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_pillar_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pillar_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pillar_visualization_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pillar_definitions
CREATE POLICY "Anyone can view pillar definitions" 
ON public.pillar_definitions 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage pillar definitions" 
ON public.pillar_definitions 
FOR ALL 
USING (is_admin(auth.uid()));

-- RLS Policies for client_pillar_activations
CREATE POLICY "Users can manage pillar activations for their clients" 
ON public.client_pillar_activations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = client_pillar_activations.client_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Clients can view their pillar activations by email" 
ON public.client_pillar_activations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = client_pillar_activations.client_id AND c.email = (auth.jwt() ->> 'email')
  )
);

-- RLS Policies for pillar_assessments
CREATE POLICY "Users can manage assessments for their clients" 
ON public.pillar_assessments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = pillar_assessments.client_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Clients can manage their own assessments by email" 
ON public.pillar_assessments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = pillar_assessments.client_id AND c.email = (auth.jwt() ->> 'email')
  ) AND created_by = auth.uid()
);

-- RLS Policies for pillar_visualization_data
CREATE POLICY "Users can view visualization data for their clients" 
ON public.pillar_visualization_data 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = pillar_visualization_data.client_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Clients can view their own visualization data by email" 
ON public.pillar_visualization_data 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = pillar_visualization_data.client_id AND c.email = (auth.jwt() ->> 'email')
  )
);

-- Add triggers for timestamp updates
CREATE TRIGGER update_pillar_definitions_updated_at
BEFORE UPDATE ON public.pillar_definitions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_pillar_activations_updated_at
BEFORE UPDATE ON public.client_pillar_activations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pillar_assessments_updated_at
BEFORE UPDATE ON public.pillar_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the Five Pillars definitions
INSERT INTO public.pillar_definitions (pillar_key, name, description, icon, color_code, ai_prompt_template, sort_order)
VALUES 
(
  'self_care',
  'Self Care',
  'Fysisk och mental hälsa, vila och återhämtning',
  '💆‍♀️',
  '#10B981',
  'Du är mentor åt en offentlig person. Analysera deras self care-nivå baserat på deras svar om sömn, stress, motion, nutrition och work-life balance. Ge konkreta råd för förbättring inom dessa områden. Fokusera på: {assessment_data}. Håll tonen varm, konkret och professionell.',
  1
),
(
  'skills',
  'Skills',
  'Färdigheter och kompetenser för karriärutveckling',
  '🎯',
  '#3B82F6',
  'Du är mentor åt en offentlig person. Analysera deras färdighetsnivå baserat på deras svar om tekniska färdigheter, kommunikation, ledarskap, kreativitet och inlärning. Föreslå utvecklingsområden och konkreta steg. Fokusera på: {assessment_data}. Håll tonen varm, konkret och professionell.',
  2
),
(
  'talent',
  'Talent',
  'Naturliga begåvningar och unika styrkor',
  '⭐',
  '#8B5CF6',
  'Du är mentor åt en offentlig person. Analysera hur väl de känner och utnyttjar sina naturliga talanger baserat på deras svar. Hjälp dem identifiera outnyttjad potential och sätt att stärka sina unika förmågor. Fokusera på: {assessment_data}. Håll tonen varm, konkret och professionell.',
  3
),
(
  'brand',
  'Brand',
  'Personligt varumärke och synlighet',
  '🎨',
  '#F59E0B',
  'Du är mentor åt en offentlig person. Analysera deras personliga varumärke och online-närvaro baserat på deras svar. Ge råd för att stärka varumärket, öka synligheten och förbättra målgruppsengagemang. Fokusera på: {assessment_data}. Håll tonen varm, konkret och professionell.',
  4
),
(
  'economy',
  'Economy',
  'Ekonomisk stabilitet och tillväxt',
  '💰',
  '#EF4444',
  'Du är mentor åt en offentlig person. Analysera deras ekonomiska situation baserat på deras svar om inkomst, planering, investeringar och säkerhet. Ge råd för att förbättra ekonomisk stabilitet och tillväxt. Fokusera på: {assessment_data}. Håll tonen varm, konkret och professionell.',
  5
);