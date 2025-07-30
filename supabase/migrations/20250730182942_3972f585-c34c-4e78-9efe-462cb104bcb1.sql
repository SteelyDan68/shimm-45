-- Fixa säkerhetsproblem med function search path
CREATE OR REPLACE FUNCTION activate_self_care_for_new_client()
RETURNS TRIGGER AS $$
BEGIN
  -- Aktivera self_care pillar för nya klienter
  INSERT INTO client_pillar_activations (client_id, pillar_key, is_active, activated_by, activated_at)
  VALUES (NEW.id, 'self_care', true, NEW.user_id, now());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;