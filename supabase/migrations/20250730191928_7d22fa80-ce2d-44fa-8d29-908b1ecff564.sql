-- Skapa storage bucket för Stefans träningsdata
INSERT INTO storage.buckets (id, name, public) 
VALUES ('stefan-training-data', 'stefan-training-data', false);

-- Skapa tabell för Stefans träningsdata
CREATE TABLE public.training_data_stefan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('manual', 'text_file', 'pdf')),
  subject TEXT,
  date_created DATE DEFAULT CURRENT_DATE,
  tone TEXT,
  client_name TEXT,
  file_url TEXT,
  original_filename TEXT,
  file_size_bytes BIGINT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_data_stefan ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own training data" 
ON public.training_data_stefan 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own training data" 
ON public.training_data_stefan 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training data" 
ON public.training_data_stefan 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own training data" 
ON public.training_data_stefan 
FOR DELETE 
USING (auth.uid() = user_id);

-- Storage policies för stefan-training-data bucket
CREATE POLICY "Users can upload their own files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'stefan-training-data' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'stefan-training-data' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'stefan-training-data' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'stefan-training-data' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger för updated_at
CREATE TRIGGER update_training_data_stefan_updated_at
BEFORE UPDATE ON public.training_data_stefan
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();