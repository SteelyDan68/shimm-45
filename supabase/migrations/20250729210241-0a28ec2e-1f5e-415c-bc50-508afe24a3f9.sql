-- Fix the security definer view issue by recreating without SECURITY DEFINER
DROP VIEW IF EXISTS client_analytics_summary;

CREATE VIEW client_analytics_summary AS
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
WHERE c.user_id = auth.uid()  -- Add RLS filter directly in the view
GROUP BY c.id, c.name;