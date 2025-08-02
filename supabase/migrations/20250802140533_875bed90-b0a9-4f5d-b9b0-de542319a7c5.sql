-- Create pillar journey tables for asynchronous user journeys

-- Main pillar journeys table
CREATE TABLE public.pillar_journeys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pillar_key TEXT NOT NULL,
  pillar_name TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'guided', -- guided, flexible, intensive
  status TEXT NOT NULL DEFAULT 'active', -- active, paused, completed, abandoned
  progress INTEGER NOT NULL DEFAULT 0, -- 0-100
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paused_at TIMESTAMP WITH TIME ZONE NULL,
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  abandoned_at TIMESTAMP WITH TIME ZONE NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Timeline tracking for journeys
CREATE TABLE public.pillar_journey_timeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id UUID NOT NULL REFERENCES public.pillar_journeys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- started, paused, resumed, completed, milestone, task_completed
  event_title TEXT NOT NULL,
  event_description TEXT,
  event_data JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Journey-specific tasks
CREATE TABLE public.pillar_journey_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id UUID NOT NULL REFERENCES public.pillar_journeys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, skipped
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high
  estimated_time INTEGER, -- minutes
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  due_date TIMESTAMP WITH TIME ZONE NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Journey reflections and insights
CREATE TABLE public.pillar_journey_reflections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id UUID NOT NULL REFERENCES public.pillar_journeys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reflection_type TEXT NOT NULL, -- milestone, completion, pause, insight
  content TEXT NOT NULL,
  insights JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pillar_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pillar_journey_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pillar_journey_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pillar_journey_reflections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pillar_journeys
CREATE POLICY "Users can manage their own journeys" 
ON public.pillar_journeys 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all journeys" 
ON public.pillar_journeys 
FOR ALL 
USING (is_admin(auth.uid()));

-- RLS Policies for pillar_journey_timeline
CREATE POLICY "Users can view their own timeline" 
ON public.pillar_journey_timeline 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert timeline events" 
ON public.pillar_journey_timeline 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all timeline events" 
ON public.pillar_journey_timeline 
FOR ALL 
USING (is_admin(auth.uid()));

-- RLS Policies for pillar_journey_tasks
CREATE POLICY "Users can manage their own journey tasks" 
ON public.pillar_journey_tasks 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all journey tasks" 
ON public.pillar_journey_tasks 
FOR ALL 
USING (is_admin(auth.uid()));

-- RLS Policies for pillar_journey_reflections
CREATE POLICY "Users can manage their own reflections" 
ON public.pillar_journey_reflections 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reflections" 
ON public.pillar_journey_reflections 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_pillar_journeys_user_id ON public.pillar_journeys(user_id);
CREATE INDEX idx_pillar_journeys_status ON public.pillar_journeys(status);
CREATE INDEX idx_pillar_journeys_pillar_key ON public.pillar_journeys(pillar_key);

CREATE INDEX idx_timeline_journey_id ON public.pillar_journey_timeline(journey_id);
CREATE INDEX idx_timeline_user_id ON public.pillar_journey_timeline(user_id);
CREATE INDEX idx_timeline_occurred_at ON public.pillar_journey_timeline(occurred_at);

CREATE INDEX idx_tasks_journey_id ON public.pillar_journey_tasks(journey_id);
CREATE INDEX idx_tasks_user_id ON public.pillar_journey_tasks(user_id);
CREATE INDEX idx_tasks_status ON public.pillar_journey_tasks(status);

CREATE INDEX idx_reflections_journey_id ON public.pillar_journey_reflections(journey_id);
CREATE INDEX idx_reflections_user_id ON public.pillar_journey_reflections(user_id);

-- Add update triggers
CREATE TRIGGER update_pillar_journeys_updated_at
BEFORE UPDATE ON public.pillar_journeys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pillar_journey_tasks_updated_at
BEFORE UPDATE ON public.pillar_journey_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();