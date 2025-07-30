-- Add visible_to_client column to path_entries table
ALTER TABLE public.path_entries 
ADD COLUMN visible_to_client boolean NOT NULL DEFAULT false;

-- Add created_by_role column to track the role of the creator
ALTER TABLE public.path_entries 
ADD COLUMN created_by_role text;

-- Add content column for longer text content (separate from details)
ALTER TABLE public.path_entries 
ADD COLUMN content text;

-- Update the type constraint to include manual_note
-- First check if there's a constraint on the type column
-- If there is, we'll need to drop and recreate it

-- Add index for better performance when filtering by visibility
CREATE INDEX idx_path_entries_visible_to_client ON public.path_entries(visible_to_client, client_id);

-- Add index for role-based filtering
CREATE INDEX idx_path_entries_created_by_role ON public.path_entries(created_by_role, client_id);