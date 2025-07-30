-- Add metadata column to path_entries for pillar tagging
ALTER TABLE public.path_entries 
ADD COLUMN metadata JSONB DEFAULT '{}';

-- Add index for better performance on metadata queries
CREATE INDEX idx_path_entries_metadata ON public.path_entries USING GIN(metadata);