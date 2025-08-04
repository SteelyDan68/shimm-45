-- Skapa kopplingen mellan messages_v2 och profiles för PostgREST schema cache
-- Vi behöver säkerställa att relationskopplingen är korrekt
ALTER TABLE IF EXISTS messages_v2 
ADD CONSTRAINT IF NOT EXISTS messages_v2_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Kontrollera att conversations också har rätt koppling
ALTER TABLE IF EXISTS conversations 
ADD CONSTRAINT IF NOT EXISTS conversations_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Även för last_message relationen via select
-- Lägg till index för bättre prestanda på foreign key lookups
CREATE INDEX IF NOT EXISTS idx_messages_v2_sender_id ON messages_v2(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);

-- Uppdatera PostgREST schema cache genom att informera om relationen
NOTIFY pgrst, 'reload schema';