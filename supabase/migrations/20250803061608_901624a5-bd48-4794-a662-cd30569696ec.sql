-- Create analytics_events table for comprehensive tracking
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  session_id TEXT NOT NULL,
  event TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  page_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics data
CREATE POLICY "Users can view their own analytics events" 
ON public.analytics_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Admins can view all analytics (for dashboard)
CREATE POLICY "Admins can view all analytics events" 
ON public.analytics_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Create indexes for better performance
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_events_event ON public.analytics_events(event);
CREATE INDEX idx_analytics_events_timestamp ON public.analytics_events(timestamp DESC);
CREATE INDEX idx_analytics_events_properties_gin ON public.analytics_events USING GIN(properties);

-- Create analytics aggregation table for better performance
CREATE TABLE public.analytics_aggregations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  event_type TEXT NOT NULL,
  user_count INTEGER DEFAULT 0,
  event_count INTEGER DEFAULT 0,
  avg_value DECIMAL,
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, event_type)
);

-- Enable RLS for aggregations
ALTER TABLE public.analytics_aggregations ENABLE ROW LEVEL SECURITY;

-- Only admins can view aggregations
CREATE POLICY "Only admins can view analytics aggregations" 
ON public.analytics_aggregations 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Create function to aggregate analytics data
CREATE OR REPLACE FUNCTION aggregate_analytics_data()
RETURNS void AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_analytics_aggregations_updated_at
BEFORE UPDATE ON public.analytics_aggregations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();