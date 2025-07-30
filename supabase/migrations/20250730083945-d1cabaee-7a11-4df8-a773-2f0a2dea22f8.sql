-- Create tasks table for TaskScheduler module
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  source_path_entry_id uuid REFERENCES public.path_entries(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'planned',
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  deadline timestamp with time zone,
  completed_at timestamp with time zone,
  ai_generated boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
CREATE POLICY "Users can view tasks for their clients"
ON public.tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = tasks.client_id 
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create tasks for their clients"
ON public.tasks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = tasks.client_id 
    AND c.user_id = auth.uid()
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Users can update tasks for their clients"
ON public.tasks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = tasks.client_id 
    AND c.user_id = auth.uid()
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Users can delete tasks for their clients"
ON public.tasks FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = tasks.client_id 
    AND c.user_id = auth.uid()
  )
  AND created_by = auth.uid()
);

-- Create indexes for better performance
CREATE INDEX idx_tasks_client_id ON public.tasks(client_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_deadline ON public.tasks(deadline);
CREATE INDEX idx_tasks_created_by ON public.tasks(created_by);

-- Add updated_at trigger
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add velocity_score column to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS velocity_score integer DEFAULT 50;