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