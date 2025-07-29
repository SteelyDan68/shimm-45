-- Add missing columns to client_data_cache table for better data storage
ALTER TABLE client_data_cache 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS snippet TEXT,
ADD COLUMN IF NOT EXISTS author TEXT,
ADD COLUMN IF NOT EXISTS image TEXT,
ADD COLUMN IF NOT EXISTS platform TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_client_data_cache_client_platform ON client_data_cache(client_id, platform);
CREATE INDEX IF NOT EXISTS idx_client_data_cache_data_type ON client_data_cache(data_type);
CREATE INDEX IF NOT EXISTS idx_client_data_cache_created_at ON client_data_cache(created_at);

-- Create a view for easier data access
CREATE OR REPLACE VIEW client_analytics_summary AS
SELECT 
  c.id as client_id,
  c.name as client_name,
  COUNT(CASE WHEN cdc.data_type = 'news' THEN 1 END) as news_count,
  COUNT(CASE WHEN cdc.data_type = 'social_metrics' THEN 1 END) as social_metrics_count,
  COUNT(CASE WHEN cdc.platform = 'youtube' THEN 1 END) as youtube_data_count,
  COUNT(CASE WHEN cdc.platform = 'instagram' THEN 1 END) as instagram_data_count,
  COUNT(CASE WHEN cdc.platform = 'tiktok' THEN 1 END) as tiktok_data_count,
  COUNT(CASE WHEN cdc.data_type = 'sentiment_analysis' THEN 1 END) as sentiment_count,
  MAX(cdc.created_at) as last_update
FROM clients c
LEFT JOIN client_data_cache cdc ON c.id = cdc.client_id
GROUP BY c.id, c.name;