-- Fix security warnings by updating the aggregate function with proper search_path
CREATE OR REPLACE FUNCTION aggregate_analytics_data()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Daily aggregation
  INSERT INTO public.analytics_aggregations (date, event_type, user_count, event_count, avg_value, properties)
  SELECT 
    DATE(timestamp) as date,
    event as event_type,
    COUNT(DISTINCT user_id) as user_count,
    COUNT(*) as event_count,
    AVG(CASE 
      WHEN properties->>'response_time_ms' IS NOT NULL 
      THEN (properties->>'response_time_ms')::decimal 
      ELSE NULL 
    END) as avg_value,
    jsonb_build_object(
      'most_common_properties', 
      (SELECT jsonb_agg(DISTINCT key) FROM jsonb_each_text(properties) WHERE key NOT IN ('timestamp', 'response_time_ms'))
    ) as properties
  FROM public.analytics_events 
  WHERE DATE(timestamp) = CURRENT_DATE - INTERVAL '1 day'
  GROUP BY DATE(timestamp), event
  ON CONFLICT (date, event_type) 
  DO UPDATE SET 
    user_count = EXCLUDED.user_count,
    event_count = EXCLUDED.event_count,
    avg_value = EXCLUDED.avg_value,
    properties = EXCLUDED.properties,
    updated_at = now();
END;
$$;