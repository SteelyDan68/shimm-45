-- Create trigger function to auto-generate actionables after assessment analysis
CREATE OR REPLACE FUNCTION trigger_auto_actionables()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for assessment_rounds with AI analysis
  IF NEW.ai_analysis IS NOT NULL AND NEW.ai_analysis != '' AND OLD.ai_analysis IS NULL THEN
    -- Call the auto-actionables-trigger edge function
    PERFORM http((
      'POST',
      concat(current_setting('app.supabase_url'), '/functions/v1/auto-actionables-trigger'),
      ARRAY[
        http_header('Authorization', concat('Bearer ', current_setting('app.supabase_service_role_key'))),
        http_header('Content-Type', 'application/json')
      ],
      'application/json',
      json_build_object(
        'user_id', NEW.user_id,
        'assessment_id', NEW.id,
        'pillar_type', NEW.pillar_type,
        'ai_analysis', NEW.ai_analysis
      )::text
    ));
    
    RAISE LOG 'Triggered auto-actionables for assessment: % (user: %, pillar: %)', 
              NEW.id, NEW.user_id, NEW.pillar_type;
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

-- Create trigger for path_entries with AI recommendations
CREATE OR REPLACE FUNCTION trigger_path_entry_actionables()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for AI-generated recommendations with substantial content
  IF NEW.type = 'recommendation' 
     AND NEW.ai_generated = true 
     AND NEW.details IS NOT NULL 
     AND length(NEW.details) > 200
     AND (NEW.metadata->>'pillar_type') IS NOT NULL THEN
    
    -- Call the auto-actionables-trigger edge function
    PERFORM http((
      'POST',
      concat(current_setting('app.supabase_url'), '/functions/v1/auto-actionables-trigger'),
      ARRAY[
        http_header('Authorization', concat('Bearer ', current_setting('app.supabase_service_role_key'))),
        http_header('Content-Type', 'application/json')
      ],
      'application/json',
      json_build_object(
        'user_id', NEW.user_id,
        'assessment_id', NEW.id,
        'pillar_type', NEW.metadata->>'pillar_type',
        'ai_analysis', NEW.details
      )::text
    ));
    
    RAISE LOG 'Triggered actionables from path_entry: % (user: %, type: %)', 
              NEW.id, NEW.user_id, NEW.type;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on path_entries for AI recommendations
DROP TRIGGER IF EXISTS auto_actionables_on_recommendation ON path_entries;
CREATE TRIGGER auto_actionables_on_recommendation
  AFTER INSERT ON path_entries
  FOR EACH ROW
  EXECUTE FUNCTION trigger_path_entry_actionables();

-- Add app settings for the triggers (will need to be set manually in production)
-- These are placeholders - actual URLs need to be configured
INSERT INTO vault.secrets (name, secret) 
VALUES 
  ('app.supabase_url', 'https://gcoorbcglxczmukzcmqs.supabase.co'),
  ('app.supabase_service_role_key', 'SERVICE_ROLE_KEY_PLACEHOLDER')
ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret;