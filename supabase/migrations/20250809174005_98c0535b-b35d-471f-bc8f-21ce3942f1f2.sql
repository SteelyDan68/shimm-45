-- Fix Eva's missing role
INSERT INTO user_roles (user_id, role, assigned_by, assigned_at) 
VALUES ('93dd2c69-373f-4831-9d06-95b1a91ac4de', 'client', 
        (SELECT id FROM auth.users WHERE email = 'stefan.hallgren@gmail.com' LIMIT 1), 
        now());