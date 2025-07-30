-- Create assessment form definitions table
CREATE TABLE public.assessment_form_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('self_care', 'skills', 'talent', 'brand', 'economy', 'general')),
  ai_prompt_template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assessment_type)
);

-- Create assessment questions table
CREATE TABLE public.assessment_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_definition_id UUID NOT NULL REFERENCES assessment_form_definitions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('scale', 'boolean', 'multiple_choice', 'text', 'textarea')),
  question_key TEXT NOT NULL, -- Used for storing answers
  options JSONB, -- For multiple choice options
  min_value INTEGER, -- For scale questions
  max_value INTEGER, -- For scale questions
  is_required BOOLEAN NOT NULL DEFAULT true,
  weight DECIMAL(3,2) DEFAULT 1.0, -- Weight for scoring
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assessment form assignments table (replaces client_pillar_assignments)
CREATE TABLE public.assessment_form_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  form_definition_id UUID NOT NULL REFERENCES assessment_form_definitions(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  due_date TIMESTAMP WITH TIME ZONE,
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, form_definition_id)
);

-- Update assessment_rounds to reference form definitions
ALTER TABLE public.assessment_rounds 
ADD COLUMN form_definition_id UUID REFERENCES assessment_form_definitions(id),
ADD COLUMN answers JSONB NOT NULL DEFAULT '{}';

-- Enable RLS
ALTER TABLE public.assessment_form_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_form_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for assessment_form_definitions
CREATE POLICY "Anyone can view active form definitions" 
ON public.assessment_form_definitions 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage form definitions" 
ON public.assessment_form_definitions 
FOR ALL 
USING (is_admin(auth.uid()));

-- RLS policies for assessment_questions
CREATE POLICY "Anyone can view questions for active forms" 
ON public.assessment_questions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM assessment_form_definitions afd 
    WHERE afd.id = assessment_questions.form_definition_id AND afd.is_active = true
  )
);

CREATE POLICY "Admins can manage questions" 
ON public.assessment_questions 
FOR ALL 
USING (is_admin(auth.uid()));

-- RLS policies for assessment_form_assignments
CREATE POLICY "Users can manage form assignments for their clients" 
ON public.assessment_form_assignments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = assessment_form_assignments.client_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Clients can view their form assignments by email" 
ON public.assessment_form_assignments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = assessment_form_assignments.client_id AND c.email = (auth.jwt() ->> 'email')
  )
);

-- Add triggers for timestamp updates
CREATE TRIGGER update_assessment_form_definitions_updated_at
BEFORE UPDATE ON public.assessment_form_definitions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessment_questions_updated_at
BEFORE UPDATE ON public.assessment_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessment_form_assignments_updated_at
BEFORE UPDATE ON public.assessment_form_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default form definitions for Five Pillars
INSERT INTO public.assessment_form_definitions (name, assessment_type, description, ai_prompt_template, created_by)
VALUES 
(
  'Self Care Assessment',
  'self_care',
  'Bedömning av fysisk och mental hälsa, vila och återhämtning',
  'Du är mentor åt en offentlig person. Analysera deras self care-nivå baserat på deras svar. Fokusera på: {answers}. Ge konkreta råd för förbättring inom sömn, stress, motion, nutrition och work-life balance. Håll tonen varm och professionell.',
  '00000000-0000-0000-0000-000000000000'
),
(
  'Skills Assessment', 
  'skills',
  'Bedömning av färdigheter och kompetenser för karriärutveckling',
  'Du är mentor åt en offentlig person. Analysera deras färdighetsnivå baserat på: {answers}. Föreslå utvecklingsområden och konkreta steg inom teknik, kommunikation, ledarskap, kreativitet och inlärning.',
  '00000000-0000-0000-0000-000000000000'
),
(
  'Talent Assessment',
  'talent', 
  'Bedömning av naturliga begåvningar och unika styrkor',
  'Du är mentor åt en offentlig person. Analysera hur väl de känner och utnyttjar sina naturliga talanger baserat på: {answers}. Hjälp dem identifiera outnyttjad potential och sätt att stärka sina unika förmågor.',
  '00000000-0000-0000-0000-000000000000'
),
(
  'Brand Assessment',
  'brand',
  'Bedömning av personligt varumärke och synlighet', 
  'Du är mentor åt en offentlig person. Analysera deras personliga varumärke och online-närvaro baserat på: {answers}. Ge råd för att stärka varumärket, öka synligheten och förbättra målgruppsengagemang.',
  '00000000-0000-0000-0000-000000000000'
),
(
  'Economy Assessment',
  'economy',
  'Bedömning av ekonomisk stabilitet och tillväxt',
  'Du är mentor åt en offentlig person. Analysera deras ekonomiska situation baserat på: {answers}. Ge råd för att förbättra ekonomisk stabilitet, planering och tillväxt. Fokusera på inkomst, investeringar och diversifiering.',
  '00000000-0000-0000-0000-000000000000'
);