-- Create a simpler trigger function that calls the edge function via pg_net
CREATE OR REPLACE FUNCTION trigger_auto_actionables()
RETURNS TRIGGER AS $$
DECLARE
  response_status INT;
  response_content TEXT;
BEGIN
  -- Only trigger for assessment_rounds with new AI analysis
  IF NEW.ai_analysis IS NOT NULL AND NEW.ai_analysis != '' AND 
     (OLD.ai_analysis IS NULL OR OLD.ai_analysis = '') THEN
    
    -- Use pg_net to call edge function asynchronously 
    SELECT INTO response_status, response_content net.http_post(
      url := 'https://gcoorbcglxczmukzcmqs.supabase.co/functions/v1/auto-actionables-trigger',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6Ikx1d2lWaG1sYmdiQ1hVTHEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2djb29yYmNnbHhjem11a3pjbXFzLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI3MjcyMzFlMC1hODRhLTQyYzQtOGU1Yi0yNzE5MzA0ODE0OWQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU0NjAzMzExLCJpYXQiOjE3NTQ1OTk3MTEsImVtYWlsIjoibGFycnkuc29uZ0Bjb2xsYWJvcmF0aXZlaHViLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOmZhbHNlfSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc1NDU5OTcxMX1dLCJzZXNzaW9uX2lkIjoiODQyNzNmNTktODBiYy00OTA0LWI2ZGEtMWI0Mjc1NGM2OWMyIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.U_1_4vJm2AobIYi6QvkRFUDCkbZUOH3XvpkmVkGdaAo'
      ),
      body := jsonb_build_object(
        'user_id', NEW.user_id,
        'assessment_id', NEW.id,
        'pillar_type', NEW.pillar_type,
        'ai_analysis', NEW.ai_analysis
      )
    ) FROM net.http_post;
    
    RAISE LOG 'Triggered auto-actionables for assessment: % (user: %, pillar: %) - Status: %', 
              NEW.id, NEW.user_id, NEW.pillar_type, response_status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on assessment_rounds for auto-actionables
DROP TRIGGER IF EXISTS auto_actionables_on_analysis ON assessment_rounds;
CREATE TRIGGER auto_actionables_on_analysis
  AFTER UPDATE ON assessment_rounds
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_actionables();