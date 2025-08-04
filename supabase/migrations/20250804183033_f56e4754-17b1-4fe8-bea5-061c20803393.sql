-- FORTSÄTT MED RESTERANDE FOREIGN KEYS OCH RLS FIX

-- Lägg till resterande foreign keys för message_read_receipts
ALTER TABLE message_read_receipts 
DROP CONSTRAINT IF EXISTS message_read_receipts_message_id_fkey;

ALTER TABLE message_read_receipts 
ADD CONSTRAINT message_read_receipts_message_id_fkey 
FOREIGN KEY (message_id) REFERENCES messages_v2(id) ON DELETE CASCADE;

ALTER TABLE message_read_receipts 
DROP CONSTRAINT IF EXISTS message_read_receipts_user_id_fkey;

ALTER TABLE message_read_receipts 
ADD CONSTRAINT message_read_receipts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Lägg till optimerade index
CREATE INDEX IF NOT EXISTS idx_messages_v2_conversation_id ON messages_v2(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message_id ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_user_id ON message_read_receipts(user_id);

-- UPPDATERA RLS POLICIES FÖR RÄTT MESSAGING-FLÖDE
-- Ge mer generös tillgång till profiles för messaging
DROP POLICY IF EXISTS "General profile access for messaging" ON profiles;
CREATE POLICY "General profile access for messaging" ON profiles
FOR SELECT 
TO authenticated
USING (true); -- Alla autentiserade kan läsa profiler för messaging