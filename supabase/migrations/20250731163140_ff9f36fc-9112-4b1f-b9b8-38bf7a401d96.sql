-- Phase 1: Create user relationships table and unified user container architecture
-- First, create user_relationships table
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

-- Update existing profiles with client data where the profile already exists
UPDATE public.profiles 
SET 
  client_category = c.category,
  client_status = c.status,
  follower_counts = c.follower_counts,
  custom_fields = c.custom_fields,
  profile_metadata = c.profile_metadata,
  logic_state = c.logic_state,
  velocity_score = c.velocity_score,
  notes = c.notes,
  tags = c.tags,
  manager_name = c.manager_name,
  manager_email = c.manager_email,
  primary_contact_name = c.primary_contact_name,
  primary_contact_email = c.primary_contact_email,
  instagram_handle = COALESCE(profiles.instagram_handle, c.instagram_handle),
  youtube_handle = COALESCE(profiles.youtube_handle, c.youtube_channel),
  tiktok_handle = COALESCE(profiles.tiktok_handle, c.tiktok_handle),
  facebook_handle = COALESCE(profiles.facebook_handle, c.facebook_page),
  phone = COALESCE(profiles.phone, c.phone),
  email = COALESCE(profiles.email, c.email),
  first_name = COALESCE(profiles.first_name, SPLIT_PART(c.name, ' ', 1)),
  last_name = COALESCE(profiles.last_name, 
    CASE 
      WHEN ARRAY_LENGTH(STRING_TO_ARRAY(c.name, ' '), 1) > 1 
      THEN ARRAY_TO_STRING(ARRAY_REMOVE(STRING_TO_ARRAY(c.name, ' '), SPLIT_PART(c.name, ' ', 1)), ' ')
      ELSE NULL 
    END)
FROM public.clients c
WHERE profiles.id = c.id;

-- Create coach-client relationships from existing clients table for existing users
INSERT INTO public.user_relationships (coach_id, client_id, relationship_type, assigned_at, is_active)
SELECT DISTINCT c.user_id, c.id, 'coach_client', c.created_at, true
FROM public.clients c
INNER JOIN public.profiles coach ON coach.id = c.user_id
INNER JOIN public.profiles client ON client.id = c.id
WHERE c.user_id IS NOT NULL
ON CONFLICT (coach_id, client_id, relationship_type) DO NOTHING;

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