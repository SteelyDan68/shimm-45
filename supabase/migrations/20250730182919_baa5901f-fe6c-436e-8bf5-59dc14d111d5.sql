-- Aktivera self_care pillar för alla befintliga klienter
INSERT INTO client_pillar_activations (client_id, pillar_key, is_active, activated_by, activated_at)
SELECT 
  c.id as client_id,
  'self_care' as pillar_key,
  true as is_active,
  c.user_id as activated_by,
  now() as activated_at
FROM clients c
WHERE NOT EXISTS (
  SELECT 1 FROM client_pillar_activations cpa 
  WHERE cpa.client_id = c.id AND cpa.pillar_key = 'self_care'
);

-- Skapa en trigger för att automatiskt aktivera self_care för nya klienter
CREATE OR REPLACE FUNCTION activate_self_care_for_new_client()
RETURNS TRIGGER AS $$
BEGIN
  -- Aktivera self_care pillar för nya klienter
  INSERT INTO client_pillar_activations (client_id, pillar_key, is_active, activated_by, activated_at)
  VALUES (NEW.id, 'self_care', true, NEW.user_id, now());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Skapa triggern
DROP TRIGGER IF EXISTS trigger_activate_self_care_new_client ON clients;
CREATE TRIGGER trigger_activate_self_care_new_client
  AFTER INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION activate_self_care_for_new_client();