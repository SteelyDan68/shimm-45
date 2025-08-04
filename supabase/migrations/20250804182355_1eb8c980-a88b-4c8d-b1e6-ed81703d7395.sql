-- Försök lägga till foreign keys endast om de inte redan existerar
-- Använd DO-block för att kolla om constraint existerar först

DO $$
BEGIN
    -- Lägg till foreign key för messages_v2.sender_id om den inte finns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_v2_sender_id_fkey' 
        AND table_name = 'messages_v2'
    ) THEN
        ALTER TABLE messages_v2 
        ADD CONSTRAINT messages_v2_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;

    -- Lägg till foreign key för conversations.created_by om den inte finns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'conversations_created_by_fkey' 
        AND table_name = 'conversations'
    ) THEN
        ALTER TABLE conversations 
        ADD CONSTRAINT conversations_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Lägg till index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_messages_v2_sender_id ON messages_v2(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);

-- Informera PostgREST om schema-ändringarna
NOTIFY pgrst, 'reload schema';