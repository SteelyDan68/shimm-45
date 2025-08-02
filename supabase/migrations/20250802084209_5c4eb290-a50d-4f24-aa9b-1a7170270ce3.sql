-- Fix security warnings for error logging functions
-- Add SECURITY DEFINER and set search_path for error functions

CREATE OR REPLACE FUNCTION public.set_error_severity()
RETURNS TRIGGER AS $$
BEGIN
  -- Determine severity based on context or message content
  IF NEW.context ILIKE '%critical%' OR NEW.message ILIKE '%critical%' THEN
    NEW.severity = 'critical';
  ELSIF NEW.context ILIKE '%warning%' OR NEW.message ILIKE '%warning%' THEN
    NEW.severity = 'warning';
  ELSE
    NEW.severity = 'error';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public';

CREATE OR REPLACE FUNCTION public.cleanup_old_error_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.error_logs 
  WHERE created_at < now() - interval '90 days'
  AND severity != 'critical'; -- Keep critical errors longer
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public';