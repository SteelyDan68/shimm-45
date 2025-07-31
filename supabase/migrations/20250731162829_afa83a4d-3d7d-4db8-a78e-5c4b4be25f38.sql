-- Phase 1: Create user relationships table for coach-client assignments
CREATE TABLE IF NOT EXISTS public.user_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'coach_client',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(coach_id, client_id, relationship_type)
);

-- Enable RLS on user_relationships
ALTER TABLE public.user_relationships ENABLE ROW LEVEL SECURITY;

-- Create policies for user_relationships
CREATE POLICY "Admins can manage all relationships" 
ON public.user_relationships 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Coaches can view their assigned clients" 
ON public.user_relationships 
FOR SELECT 
USING (auth.uid() = coach_id OR auth.uid() = client_id);

CREATE POLICY "Coaches can create client relationships" 
ON public.user_relationships 
FOR INSERT 
WITH CHECK (auth.uid() = coach_id OR is_admin(auth.uid()));

-- Add missing fields to profiles for complete user container
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS client_category TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS client_status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS follower_counts JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS logic_state JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS velocity_score INTEGER DEFAULT 50;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS manager_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS manager_email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS primary_contact_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS primary_contact_email TEXT;

-- Migrate data from clients table to profiles table
INSERT INTO public.profiles (
  id, email, first_name, last_name, phone, 
  client_category, client_status, follower_counts, custom_fields, 
  profile_metadata, logic_state, velocity_score, notes, tags,
  manager_name, manager_email, primary_contact_name, primary_contact_email,
  instagram_handle, youtube_handle, tiktok_handle, facebook_handle,
  created_at, updated_at
)
SELECT 
  c.id, c.email, 
  SPLIT_PART(c.name, ' ', 1) as first_name,
  CASE 
    WHEN ARRAY_LENGTH(STRING_TO_ARRAY(c.name, ' '), 1) > 1 
    THEN ARRAY_TO_STRING(ARRAY_REMOVE(STRING_TO_ARRAY(c.name, ' '), SPLIT_PART(c.name, ' ', 1)), ' ')
    ELSE NULL 
  END as last_name,
  c.phone, c.category, c.status, c.follower_counts, c.custom_fields,
  c.profile_metadata, c.logic_state, c.velocity_score, c.notes, c.tags,
  c.manager_name, c.manager_email, c.primary_contact_name, c.primary_contact_email,
  c.instagram_handle, c.youtube_channel, c.tiktok_handle, c.facebook_page,
  c.created_at, c.updated_at
FROM public.clients c
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = c.id)
ON CONFLICT (id) DO UPDATE SET
  client_category = EXCLUDED.client_category,
  client_status = EXCLUDED.client_status,
  follower_counts = EXCLUDED.follower_counts,
  custom_fields = EXCLUDED.custom_fields,
  profile_metadata = EXCLUDED.profile_metadata,
  logic_state = EXCLUDED.logic_state,
  velocity_score = EXCLUDED.velocity_score,
  notes = EXCLUDED.notes,
  tags = EXCLUDED.tags,
  manager_name = EXCLUDED.manager_name,
  manager_email = EXCLUDED.manager_email,
  primary_contact_name = EXCLUDED.primary_contact_name,
  primary_contact_email = EXCLUDED.primary_contact_email;

-- Create coach-client relationships from existing clients table
INSERT INTO public.user_relationships (coach_id, client_id, relationship_type, assigned_at, is_active)
SELECT DISTINCT c.user_id, c.id, 'coach_client', c.created_at, true
FROM public.clients c
WHERE c.user_id IS NOT NULL
ON CONFLICT (coach_id, client_id, relationship_type) DO NOTHING;

-- Update foreign key references to point to profiles instead of clients
-- Update assessment_rounds
UPDATE public.assessment_rounds 
SET client_id = c.id 
FROM public.clients c 
WHERE assessment_rounds.client_id = c.id;

-- Update calendar_events  
UPDATE public.calendar_events 
SET client_id = c.id 
FROM public.clients c 
WHERE calendar_events.client_id = c.id;

-- Update client_data_cache
UPDATE public.client_data_cache 
SET client_id = c.id 
FROM public.clients c 
WHERE client_data_cache.client_id = c.id;

-- Update client_pillar_activations
UPDATE public.client_pillar_activations 
SET client_id = c.id 
FROM public.clients c 
WHERE client_pillar_activations.client_id = c.id;

-- Update client_pillar_assignments
UPDATE public.client_pillar_assignments 
SET client_id = c.id 
FROM public.clients c 
WHERE client_pillar_assignments.client_id = c.id;

-- Update path_entries
UPDATE public.path_entries 
SET client_id = c.id 
FROM public.clients c 
WHERE path_entries.client_id = c.id;

-- Update pillar_assessments
UPDATE public.pillar_assessments 
SET client_id = c.id 
FROM public.clients c 
WHERE pillar_assessments.client_id = c.id;

-- Update pillar_visualization_data
UPDATE public.pillar_visualization_data 
SET client_id = c.id 
FROM public.clients c 
WHERE pillar_visualization_data.client_id = c.id;

-- Update tasks
UPDATE public.tasks 
SET client_id = c.id 
FROM public.clients c 
WHERE tasks.client_id = c.id;

-- Update weekly_email_logs
UPDATE public.weekly_email_logs 
SET client_id = c.id 
FROM public.clients c 
WHERE weekly_email_logs.client_id = c.id;

-- Update assessment_form_assignments
UPDATE public.assessment_form_assignments 
SET client_id = c.id 
FROM public.clients c 
WHERE assessment_form_assignments.client_id = c.id;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_relationships_coach_id ON public.user_relationships(coach_id);
CREATE INDEX IF NOT EXISTS idx_user_relationships_client_id ON public.user_relationships(client_id);
CREATE INDEX IF NOT EXISTS idx_user_relationships_active ON public.user_relationships(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_client_status ON public.profiles(client_status) WHERE client_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_client_category ON public.profiles(client_category) WHERE client_category IS NOT NULL;

-- Update triggers
CREATE TRIGGER update_user_relationships_updated_at
BEFORE UPDATE ON public.user_relationships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.user_relationships IS 'Manages coach-client and other user relationships in the unified container architecture';
COMMENT ON COLUMN public.profiles.client_category IS 'Category of client (migrated from clients table)';
COMMENT ON COLUMN public.profiles.client_status IS 'Status of client (migrated from clients table)';
COMMENT ON COLUMN public.profiles.logic_state IS 'Client logic state (migrated from clients table)';
COMMENT ON COLUMN public.profiles.velocity_score IS 'Client velocity score (migrated from clients table)';

-- Note: We'll keep the clients table for now for backwards compatibility
-- but it should not be used for new functionality