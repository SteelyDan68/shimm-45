-- Enable realtime for client_data_cache table
ALTER TABLE public.client_data_cache REPLICA IDENTITY FULL;

-- Add table to realtime publication
INSERT INTO supabase_realtime.publication_tables (publication, table_id)
SELECT 'supabase_realtime', 
       oid::text
FROM pg_class 
WHERE relname = 'client_data_cache' 
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ON CONFLICT DO NOTHING;