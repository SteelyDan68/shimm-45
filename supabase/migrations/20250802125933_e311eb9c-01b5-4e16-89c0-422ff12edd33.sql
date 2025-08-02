-- Auto-activate all pillars for existing and new clients
-- First, activate all pillars for existing clients
INSERT INTO client_pillar_activations (user_id, pillar_key, is_active, activated_by, activated_at)
SELECT 
  p.id as user_id,
  unnest(ARRAY['self_care', 'skills', 'talent', 'brand', 'economy', 'open_track']) as pillar_key,
  true as is_active,
  p.id as activated_by,
  now() as activated_at
FROM profiles p
WHERE p.id IS NOT NULL
ON CONFLICT (user_id, pillar_key) 
DO UPDATE SET 
  is_active = true,
  activated_at = now();

-- Create function to auto-activate all pillars for new users
CREATE OR REPLACE FUNCTION auto_activate_all_pillars_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Activate all pillars for the new user
  INSERT INTO client_pillar_activations (user_id, pillar_key, is_active, activated_by, activated_at)
  VALUES 
    (NEW.id, 'self_care', true, NEW.id, now()),
    (NEW.id, 'skills', true, NEW.id, now()),
    (NEW.id, 'talent', true, NEW.id, now()),
    (NEW.id, 'brand', true, NEW.id, now()),
    (NEW.id, 'economy', true, NEW.id, now()),
    (NEW.id, 'open_track', true, NEW.id, now())
  ON CONFLICT (user_id, pillar_key) 
  DO UPDATE SET 
    is_active = true,
    activated_at = now();
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-activate pillars for new profiles
DROP TRIGGER IF EXISTS trigger_auto_activate_pillars ON profiles;
CREATE TRIGGER trigger_auto_activate_pillars
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_activate_all_pillars_for_new_user();