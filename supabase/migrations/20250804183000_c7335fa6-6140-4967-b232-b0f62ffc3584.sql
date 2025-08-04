-- MESSAGING SYSTEM FOREIGN KEYS FIX
-- Korrekt syntax för att lägga till foreign keys

-- Lägg till foreign keys en i taget med korrekt syntax
ALTER TABLE messages_v2 
DROP CONSTRAINT IF EXISTS messages_v2_sender_id_fkey;

ALTER TABLE messages_v2 
ADD CONSTRAINT messages_v2_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE messages_v2 
DROP CONSTRAINT IF EXISTS messages_v2_conversation_id_fkey;

ALTER TABLE messages_v2 
ADD CONSTRAINT messages_v2_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

ALTER TABLE conversations 
DROP CONSTRAINT IF EXISTS conversations_created_by_fkey;

ALTER TABLE conversations 
ADD CONSTRAINT conversations_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;