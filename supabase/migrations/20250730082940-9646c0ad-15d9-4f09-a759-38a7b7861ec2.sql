-- Create path_entries table for ClientPath module
CREATE TABLE public.path_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  type text NOT NULL CHECK (type IN ('assessment', 'recommendation', 'action', 'note', 'check-in')),
  title text NOT NULL,
  details text,
  status text NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed')) DEFAULT 'planned',
  linked_task_id uuid NULL,
  ai_generated boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.path_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for path_entries
CREATE POLICY "Users can view path entries for their clients"
ON public.path_entries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = path_entries.client_id 
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create path entries for their clients"
ON public.path_entries FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = path_entries.client_id 
    AND c.user_id = auth.uid()
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Users can update path entries for their clients"
ON public.path_entries FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = path_entries.client_id 
    AND c.user_id = auth.uid()
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Users can delete path entries for their clients"
ON public.path_entries FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = path_entries.client_id 
    AND c.user_id = auth.uid()
  )
  AND created_by = auth.uid()
);

-- Create indexes for better performance
CREATE INDEX idx_path_entries_client_id ON public.path_entries(client_id);
CREATE INDEX idx_path_entries_timestamp ON public.path_entries(timestamp DESC);
CREATE INDEX idx_path_entries_type ON public.path_entries(type);
CREATE INDEX idx_path_entries_status ON public.path_entries(status);

-- Add updated_at trigger
CREATE TRIGGER update_path_entries_updated_at
  BEFORE UPDATE ON public.path_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();