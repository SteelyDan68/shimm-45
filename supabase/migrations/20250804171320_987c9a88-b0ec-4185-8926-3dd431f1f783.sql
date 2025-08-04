-- Fix foreign key relationship between messages_v2 and profiles
ALTER TABLE messages_v2 
ADD CONSTRAINT messages_v2_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add foreign key relationship between conversations and profiles  
ALTER TABLE conversations
ADD CONSTRAINT conversations_created_by_fkey
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;