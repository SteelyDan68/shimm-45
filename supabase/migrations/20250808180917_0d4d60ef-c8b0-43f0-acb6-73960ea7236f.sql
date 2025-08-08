-- Create missing tables only if they don't exist and fix existing ones
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

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'assessment_detailed_analyses' 
    AND schemaname = 'public'
  ) THEN
    ALTER TABLE public.assessment_detailed_analyses ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Users can view their own detailed analyses"
    ON public.assessment_detailed_analyses
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;