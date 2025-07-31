-- Create client_data_containers table for XML-based longitudinal data storage
CREATE TABLE public.client_data_containers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  container_type TEXT NOT NULL, -- 'assessment_bundle', 'progress_timeline', 'intervention_record', etc.
  xml_content XML NOT NULL,
  metadata JSONB DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  
  -- Index for efficient queries
  CONSTRAINT fk_client_data_containers_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.client_data_containers ENABLE ROW LEVEL SECURITY;

-- Create policies for client data containers
CREATE POLICY "Users can manage containers for their clients" 
ON public.client_data_containers 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM clients c 
  WHERE c.id = client_data_containers.client_id 
  AND c.user_id = auth.uid()
));

CREATE POLICY "Clients can view their own containers by email" 
ON public.client_data_containers 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM clients c 
  WHERE c.id = client_data_containers.client_id 
  AND c.email = auth.jwt() ->> 'email'
));

CREATE POLICY "Admins can manage all containers" 
ON public.client_data_containers 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_client_data_containers_client_id ON public.client_data_containers(client_id);
CREATE INDEX idx_client_data_containers_type ON public.client_data_containers(container_type);
CREATE INDEX idx_client_data_containers_created_at ON public.client_data_containers(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_client_data_containers_updated_at
  BEFORE UPDATE ON public.client_data_containers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();