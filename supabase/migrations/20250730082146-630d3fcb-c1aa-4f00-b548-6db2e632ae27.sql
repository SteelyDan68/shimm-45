-- Get the current user's ID (replace with actual ID from auth.users if needed)
-- For now, we'll make the first user a superadmin

-- Update the first user to be superadmin
DO $$
DECLARE
    first_user_id uuid;
BEGIN
    -- Get the first user from profiles
    SELECT id INTO first_user_id FROM profiles ORDER BY created_at ASC LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
        -- Remove existing roles for this user
        DELETE FROM user_roles WHERE user_id = first_user_id;
        
        -- Add superadmin role
        INSERT INTO user_roles (user_id, role) VALUES (first_user_id, 'superadmin');
        
        -- Update profile information
        UPDATE profiles 
        SET 
            first_name = COALESCE(first_name, 'Super'),
            last_name = COALESCE(last_name, 'Admin'),
            status = 'active'
        WHERE id = first_user_id;
        
        RAISE NOTICE 'User % has been granted superadmin privileges', first_user_id;
    ELSE
        RAISE NOTICE 'No users found in profiles table';
    END IF;
END $$;