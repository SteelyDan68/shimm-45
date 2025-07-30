-- Insert profile for existing auth user and grant superadmin role
DO $$
DECLARE
    auth_user_id uuid;
    auth_user_email text;
BEGIN
    -- Get the first user from auth.users
    SELECT id, email INTO auth_user_id, auth_user_email 
    FROM auth.users 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    IF auth_user_id IS NOT NULL THEN
        -- Insert profile if it doesn't exist
        INSERT INTO public.profiles (
            id, 
            email, 
            first_name, 
            last_name,
            status
        ) VALUES (
            auth_user_id,
            auth_user_email,
            'Super',
            'Admin',
            'active'
        )
        ON CONFLICT (id) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            status = EXCLUDED.status;
        
        -- Remove existing roles and add superadmin
        DELETE FROM public.user_roles WHERE user_id = auth_user_id;
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (auth_user_id, 'superadmin');
        
        RAISE NOTICE 'Created profile and granted superadmin to user: % (%)', auth_user_email, auth_user_id;
    ELSE
        RAISE NOTICE 'No users found in auth.users table';
    END IF;
END $$;