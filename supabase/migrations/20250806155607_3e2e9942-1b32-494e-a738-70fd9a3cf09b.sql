-- Clean up duplicate and null role entries for Anna
DELETE FROM user_roles 
WHERE user_id = '3724384a-a36a-436f-b888-0b782652ba2a' 
AND role IS NULL;

-- Verify Anna has only the client role
SELECT 
  ur.user_id,
  ur.role,
  p.email
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.id
WHERE p.email = 'anna@happyminds.com';