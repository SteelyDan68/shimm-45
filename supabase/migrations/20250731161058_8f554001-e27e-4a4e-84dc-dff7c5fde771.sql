-- Add social media and onboarding fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram_handle text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS youtube_handle text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tiktok_handle text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS snapchat_handle text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS facebook_handle text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS twitter_handle text;

-- Add additional profile fields from onboarding
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS height text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weight text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS physical_limitations text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS neurodiversity text;

-- Add public role fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS primary_role text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS secondary_role text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS niche text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS creative_strengths text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS platforms jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS challenges text;

-- Add life map fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS living_with text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_children text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ongoing_changes text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS past_crises text;

-- Add onboarding tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamp with time zone;

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_profiles_instagram_handle ON public.profiles(instagram_handle) WHERE instagram_handle IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_youtube_handle ON public.profiles(youtube_handle) WHERE youtube_handle IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_tiktok_handle ON public.profiles(tiktok_handle) WHERE tiktok_handle IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_primary_role ON public.profiles(primary_role) WHERE primary_role IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON public.profiles(onboarding_completed);

COMMENT ON COLUMN public.profiles.instagram_handle IS 'Instagram username/handle';
COMMENT ON COLUMN public.profiles.youtube_handle IS 'YouTube channel name or handle';
COMMENT ON COLUMN public.profiles.tiktok_handle IS 'TikTok username/handle';
COMMENT ON COLUMN public.profiles.snapchat_handle IS 'Snapchat username/handle';
COMMENT ON COLUMN public.profiles.facebook_handle IS 'Facebook page/profile handle';
COMMENT ON COLUMN public.profiles.twitter_handle IS 'Twitter/X username/handle';
COMMENT ON COLUMN public.profiles.platforms IS 'JSON array of active platforms';
COMMENT ON COLUMN public.profiles.has_children IS 'Whether user has children: no, yes, planning';