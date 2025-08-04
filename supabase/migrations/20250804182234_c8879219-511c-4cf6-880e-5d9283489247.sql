-- Fix missing foreign key relationship between messages_v2 and profiles
ALTER TABLE messages_v2 
ADD CONSTRAINT messages_v2_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Also ensure conversations table has proper foreign key
ALTER TABLE conversations 
ADD CONSTRAINT conversations_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;