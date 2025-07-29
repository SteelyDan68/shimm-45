-- Add logic_state field to clients table
ALTER TABLE public.clients 
ADD COLUMN logic_state JSONB DEFAULT '{}';

-- Create index for better performance on logic_state queries
CREATE INDEX idx_clients_logic_state ON public.clients USING GIN(logic_state);