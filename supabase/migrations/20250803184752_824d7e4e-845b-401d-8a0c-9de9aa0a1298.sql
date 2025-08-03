-- First, check if foreign keys already exist and add them if they don't
DO $$ 
BEGIN
    -- Add foreign key for sender_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_sender_id_fkey' 
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE public.messages 
        ADD CONSTRAINT messages_sender_id_fkey 
        FOREIGN KEY (sender_id) 
        REFERENCES public.profiles(id) 
        ON DELETE CASCADE;
    END IF;

    -- Add foreign key for receiver_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_receiver_id_fkey' 
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE public.messages 
        ADD CONSTRAINT messages_receiver_id_fkey 
        FOREIGN KEY (receiver_id) 
        REFERENCES public.profiles(id) 
        ON DELETE CASCADE;
    END IF;
END $$;