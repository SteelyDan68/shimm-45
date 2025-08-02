-- Clean up incorrect coach-client assignment where coach and client are same person
DELETE FROM coach_client_assignments WHERE coach_id = client_id;

-- Create proper coach-client relationship
-- Coach: stefan.hallgren@gmail.com (ID: 9065f42b-b9cc-4252-b73f-4374c6286b5e)  
-- Client: stefan.hallgren@happyminds.com (ID: 5489d5a1-79c7-49b0-8ce3-578967d18cf6)
INSERT INTO coach_client_assignments (coach_id, client_id, assigned_by, is_active)
VALUES (
  '9065f42b-b9cc-4252-b73f-4374c6286b5e', -- stefan.hallgren@gmail.com (coach)
  '5489d5a1-79c7-49b0-8ce3-578967d18cf6', -- stefan.hallgren@happyminds.com (client)  
  '9065f42b-b9cc-4252-b73f-4374c6286b5e', -- assigned by the coach
  true
);