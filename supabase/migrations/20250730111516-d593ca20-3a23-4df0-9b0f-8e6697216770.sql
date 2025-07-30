-- Create assessment rounds table to store pillar assessments
CREATE TABLE public.assessment_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  pillar_type TEXT NOT NULL CHECK (pillar_type IN ('self_care', 'skills', 'talent', 'brand', 'economy')),
  scores JSONB NOT NULL DEFAULT '{}',
  comments TEXT,
  ai_analysis TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client pillar assignments table
CREATE TABLE public.client_pillar_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  pillar_type TEXT NOT NULL CHECK (pillar_type IN ('self_care', 'skills', 'talent', 'brand', 'economy')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, pillar_type)
);

-- Enable RLS
ALTER TABLE public.assessment_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_pillar_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for assessment_rounds
CREATE POLICY "Users can create assessments for their clients" 
ON public.assessment_rounds 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = assessment_rounds.client_id AND c.user_id = auth.uid()
  ) AND created_by = auth.uid()
);

CREATE POLICY "Users can view assessments for their clients" 
ON public.assessment_rounds 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = assessment_rounds.client_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Clients can view their own assessments by email" 
ON public.assessment_rounds 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = assessment_rounds.client_id AND c.email = (auth.jwt() ->> 'email')
  )
);

CREATE POLICY "Clients can create their own assessments by email" 
ON public.assessment_rounds 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = assessment_rounds.client_id AND c.email = (auth.jwt() ->> 'email')
  ) AND created_by = auth.uid()
);

-- RLS policies for client_pillar_assignments
CREATE POLICY "Users can manage pillar assignments for their clients" 
ON public.client_pillar_assignments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = client_pillar_assignments.client_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Clients can view their pillar assignments by email" 
ON public.client_pillar_assignments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = client_pillar_assignments.client_id AND c.email = (auth.jwt() ->> 'email')
  )
);

-- Add triggers for timestamp updates
CREATE TRIGGER update_assessment_rounds_updated_at
BEFORE UPDATE ON public.assessment_rounds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_pillar_assignments_updated_at
BEFORE UPDATE ON public.client_pillar_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();