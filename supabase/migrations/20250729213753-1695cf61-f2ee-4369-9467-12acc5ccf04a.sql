-- Enable realtime for client_data_cache table
ALTER TABLE public.client_data_cache REPLICA IDENTITY FULL;