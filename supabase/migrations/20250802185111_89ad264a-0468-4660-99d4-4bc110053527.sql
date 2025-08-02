-- Fix the client_data_cache table schema issue
-- The table needs user_id column to be renamed to client_id for consistency

ALTER TABLE public.client_data_cache 
RENAME COLUMN user_id TO client_id;

-- Add index for better performance on client_id lookups
CREATE INDEX IF NOT EXISTS idx_client_data_cache_client_id 
ON public.client_data_cache(client_id);

-- Update the cache data format to support the new Intelligence Hub structure
ALTER TABLE public.client_data_cache 
ADD COLUMN IF NOT EXISTS data_quality_score DECIMAL(3,2) DEFAULT 0.0;

ALTER TABLE public.client_data_cache 
ADD COLUMN IF NOT EXISTS last_sentiment_analysis JSONB;

ALTER TABLE public.client_data_cache 
ADD COLUMN IF NOT EXISTS competitive_insights JSONB;

-- Create a comprehensive intelligence_profiles table for the new unified Intelligence system
CREATE TABLE IF NOT EXISTS public.intelligence_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Core metrics and insights
  metrics JSONB DEFAULT '[]'::jsonb,
  insights JSONB DEFAULT '[]'::jsonb,
  
  -- Social media profiles and analytics
  social_profiles JSONB DEFAULT '[]'::jsonb,
  
  -- News mentions and media coverage
  news_mentions JSONB DEFAULT '[]'::jsonb,
  
  -- Behavioral analytics for coach guidance
  behavioral_analytics JSONB DEFAULT '{}'::jsonb,
  
  -- Six Pillars integration for holistic coaching view
  pillar_progress JSONB DEFAULT '[]'::jsonb,
  
  -- Coaching journey tracking for coach insights
  coaching_journey JSONB DEFAULT '{}'::jsonb,
  
  -- Public visibility metrics for notability assessment
  notability_score DECIMAL(3,2) DEFAULT 0.0,
  online_presence_strength TEXT DEFAULT 'unknown',
  brand_health_status TEXT DEFAULT 'unknown',
  
  -- Sentiment and competitive analysis for coach advisory
  sentiment_analysis JSONB DEFAULT '{}'::jsonb,
  competitive_landscape JSONB DEFAULT '{}'::jsonb,
  collaboration_opportunities JSONB DEFAULT '[]'::jsonb,
  
  -- Data quality and privacy controls
  data_quality DECIMAL(3,2) DEFAULT 0.0,
  privacy_settings JSONB DEFAULT '{"shareAnalytics": true, "shareProgress": true, "shareSocialData": false}'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_analysis_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT intelligence_profiles_client_id_fkey 
    FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on intelligence_profiles
ALTER TABLE public.intelligence_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for intelligence_profiles - coaches and admins can see their clients' data
CREATE POLICY "Coaches can view their clients' intelligence profiles" 
ON public.intelligence_profiles 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT coach_id FROM public.coach_client_relationships 
    WHERE client_id = intelligence_profiles.client_id
  )
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  )
);

CREATE POLICY "Admins can manage all intelligence profiles" 
ON public.intelligence_profiles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  )
);

CREATE POLICY "System can create intelligence profiles" 
ON public.intelligence_profiles 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update intelligence profiles" 
ON public.intelligence_profiles 
FOR UPDATE 
USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_intelligence_profiles_client_id 
ON public.intelligence_profiles(client_id);

CREATE INDEX IF NOT EXISTS idx_intelligence_profiles_notability 
ON public.intelligence_profiles(notability_score DESC);

CREATE INDEX IF NOT EXISTS idx_intelligence_profiles_updated_at 
ON public.intelligence_profiles(updated_at DESC);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_intelligence_profiles_updated_at
BEFORE UPDATE ON public.intelligence_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();