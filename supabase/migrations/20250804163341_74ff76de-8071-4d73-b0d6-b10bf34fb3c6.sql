-- Fix security warnings for message system functions
-- Set proper search_path for security

ALTER FUNCTION update_conversation_last_message() SET search_path = 'public';
ALTER FUNCTION update_updated_at_messages() SET search_path = 'public';