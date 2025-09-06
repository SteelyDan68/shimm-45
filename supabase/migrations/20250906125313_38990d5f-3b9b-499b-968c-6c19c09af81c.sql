-- Create neuroplasticity profile tracking table
CREATE TABLE public.user_neuroplasticity_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create neuroplastic progress tracking table
CREATE TABLE public.neuroplastic_progress_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pillar_type TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  completion_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  neuroplastic_markers JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create neuroplastic learning modules table
CREATE TABLE public.neuroplastic_learning_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_neuroplasticity_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neuroplastic_progress_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neuroplastic_learning_modules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own neuroplasticity profiles"
ON public.user_neuroplasticity_profiles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own progress tracking"
ON public.neuroplastic_progress_tracking
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own learning modules"
ON public.neuroplastic_learning_modules
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_neuroplasticity_profiles_user_id ON public.user_neuroplasticity_profiles(user_id);
CREATE INDEX idx_progress_tracking_user_pillar ON public.neuroplastic_progress_tracking(user_id, pillar_type);
CREATE INDEX idx_learning_modules_user_id ON public.neuroplastic_learning_modules(user_id);