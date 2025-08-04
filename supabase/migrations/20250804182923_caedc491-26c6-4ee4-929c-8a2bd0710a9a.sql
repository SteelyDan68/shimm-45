-- KOMPLETT MESSAGING SYSTEM FIX
-- Vi måste skapa alla foreign keys och fixa RLS policies

-- 1. Kontrollera om foreign keys existerar och skapa dem
DROP CONSTRAINT IF EXISTS messages_v2_sender_id_fkey CASCADE;
DROP CONSTRAINT IF EXISTS messages_v2_conversation_id_fkey CASCADE;
DROP CONSTRAINT IF EXISTS conversations_created_by_fkey CASCADE;
DROP CONSTRAINT IF EXISTS message_read_receipts_message_id_fkey CASCADE;
DROP CONSTRAINT IF EXISTS message_read_receipts_user_id_fkey CASCADE;

-- 2. Skapa alla nödvändiga foreign keys
ALTER TABLE messages_v2 
ADD CONSTRAINT messages_v2_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE messages_v2 
ADD CONSTRAINT messages_v2_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

ALTER TABLE conversations 
ADD CONSTRAINT conversations_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE message_read_receipts 
ADD CONSTRAINT message_read_receipts_message_id_fkey 
FOREIGN KEY (message_id) REFERENCES messages_v2(id) ON DELETE CASCADE;

ALTER TABLE message_read_receipts 
ADD CONSTRAINT message_read_receipts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 3. Lägg till index för prestanda
CREATE INDEX IF NOT EXISTS idx_messages_v2_sender_id ON messages_v2(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_v2_conversation_id ON messages_v2(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message_id ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_user_id ON message_read_receipts(user_id);