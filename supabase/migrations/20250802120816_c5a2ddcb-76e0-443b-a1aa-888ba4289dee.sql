-- Rensa felaktig coach-client assignment
DELETE FROM coach_client_assignments 
WHERE coach_id = '754d7eeb-d9ce-4ede-95e6-f1c0408dfd3e' 
AND client_id = '754d7eeb-d9ce-4ede-95e6-f1c0408dfd3e';

-- Skapa korrekt coach-client assignment
-- stefan.hallgren@gmail.com (coach) -> stefan.hallgren@happyminds.com (client)
INSERT INTO coach_client_assignments (coach_id, client_id, assigned_by, is_active)
VALUES (
  '9065f42b-b9cc-4252-b73f-4374c6286b5e', -- stefan.hallgren@gmail.com
  '5489d5a1-79c7-49b0-8ce3-578967d18cf6', -- stefan.hallgren@happyminds.com
  '9065f42b-b9cc-4252-b73f-4374c6286b5e', -- assigned by stefan.hallgren@gmail.com
  true
);