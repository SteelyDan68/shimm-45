-- Create calendar_events table for manual events
CREATE TABLE public.calendar_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  event_date timestamp with time zone NOT NULL,
  created_by uuid NOT NULL,
  created_by_role text NOT NULL,
  visible_to_client boolean NOT NULL DEFAULT false,
  category text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage events for their clients" 
ON public.calendar_events 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM clients c 
  WHERE c.id = calendar_events.client_id 
  AND c.user_id = auth.uid()
));

CREATE POLICY "Clients can view their own events" 
ON public.calendar_events 
FOR SELECT 
USING (
  visible_to_client = true 
  AND EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = calendar_events.client_id 
    AND c.email = (auth.jwt() ->> 'email'::text)
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_calendar_events_updated_at
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_calendar_events_client_date ON public.calendar_events(client_id, event_date);
CREATE INDEX idx_calendar_events_visible ON public.calendar_events(visible_to_client, client_id);