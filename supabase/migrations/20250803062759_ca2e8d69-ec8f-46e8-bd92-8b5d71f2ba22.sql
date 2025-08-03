-- Create function to insert analytics events to avoid TypeScript issues
CREATE OR REPLACE FUNCTION insert_analytics_events(events_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  event_record jsonb;
BEGIN
  -- Loop through the events array and insert each event
  FOR event_record IN SELECT jsonb_array_elements(events_data)
  LOOP
    INSERT INTO public.analytics_events (
      user_id, 
      session_id, 
      event, 
      properties, 
      timestamp, 
      page_url, 
      user_agent
    ) VALUES (
      (event_record->>'user_id')::uuid,
      event_record->>'session_id',
      event_record->>'event',
      COALESCE(event_record->'properties', '{}'::jsonb),
      (event_record->>'timestamp')::timestamp with time zone,
      event_record->>'page_url',
      event_record->>'user_agent'
    );
  END LOOP;
END;
$$;