-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('influencer', 'creator', 'brand', 'other')),
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect')),
  
  -- Contact information
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  manager_name TEXT,
  manager_email TEXT,
  
  -- Social media handles
  instagram_handle TEXT,
  tiktok_handle TEXT,
  youtube_channel TEXT,
  follower_counts JSONB DEFAULT '{}',
  
  -- Notes and metadata
  notes TEXT,
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own clients" 
ON public.clients 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clients" 
ON public.clients 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" 
ON public.clients 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" 
ON public.clients 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create client_data_cache table for future dataCollector module
CREATE TABLE public.client_data_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL CHECK (data_type IN ('news', 'social_metrics', 'ai_analysis', 'web_scraping')),
  source TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for client_data_cache
ALTER TABLE public.client_data_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for client_data_cache (access through client ownership)
CREATE POLICY "Users can view cache for their clients" 
ON public.client_data_cache 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = client_data_cache.client_id 
    AND clients.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert cache for their clients" 
ON public.client_data_cache 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = client_data_cache.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- Create index for better performance
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_client_data_cache_client_id ON public.client_data_cache(client_id);
CREATE INDEX idx_client_data_cache_data_type ON public.client_data_cache(data_type);
CREATE INDEX idx_client_data_cache_expires_at ON public.client_data_cache(expires_at);