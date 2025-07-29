-- Fix data type constraint that's blocking DataCollector
ALTER TABLE client_data_cache DROP CONSTRAINT IF EXISTS client_data_cache_data_type_check;

-- Add more flexible constraint that allows our new data types
ALTER TABLE client_data_cache ADD CONSTRAINT client_data_cache_data_type_check 
CHECK (data_type IN ('news', 'social_metrics', 'web_scraping', 'sentiment_analysis', 'discovered_profile', 'business_intelligence'));