-- CRITICAL DATABASE REPAIR - Fix conversations foreign key constraint
-- Fix the foreign key constraint issue in conversations table

-- First check if conversations table exists and what foreign keys it has
-- The error suggests conversations.created_by references a table that doesn't have matching records

-- Fix conversations table foreign key constraint
-- Drop the problematic foreign key constraint if it exists
ALTER TABLE IF EXISTS conversations DROP CONSTRAINT IF EXISTS conversations_created_by_fkey;

-- Add proper foreign key constraint that references profiles table (not auth.users)
ALTER TABLE IF EXISTS conversations 
ADD CONSTRAINT conversations_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Ensure conversations table has proper structure for messaging
-- Add missing columns if they don't exist
ALTER TABLE IF EXISTS conversations 
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING GIN(participant_ids);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Ensure messages_v2 table exists with proper structure
CREATE TABLE IF NOT EXISTS messages_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'emoji', 'file', 'voice', 'system')),
  parent_message_id UUID,
  metadata JSONB DEFAULT '{}',
  reactions JSONB DEFAULT '{}',
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT messages_v2_conversation_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT messages_v2_sender_fkey FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT messages_v2_parent_fkey FOREIGN KEY (parent_message_id) REFERENCES messages_v2(id) ON DELETE SET NULL
);

-- Enable RLS on messages_v2
ALTER TABLE messages_v2 ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for messages_v2
CREATE POLICY "Users can view messages in their conversations" ON messages_v2
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages_v2.conversation_id 
      AND auth.uid() = ANY(conversations.participant_ids)
    )
  );

CREATE POLICY "Users can insert messages in their conversations" ON messages_v2
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages_v2.conversation_id 
      AND auth.uid() = ANY(conversations.participant_ids)
    )
  );

CREATE POLICY "Users can update their own messages" ON messages_v2
  FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages" ON messages_v2
  FOR DELETE USING (auth.uid() = sender_id);

-- Create message_read_receipts table
CREATE TABLE IF NOT EXISTS message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT message_read_receipts_message_fkey FOREIGN KEY (message_id) REFERENCES messages_v2(id) ON DELETE CASCADE,
  CONSTRAINT message_read_receipts_user_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Ensure user can only read a message once
  UNIQUE(message_id, user_id)
);

-- Enable RLS on message_read_receipts
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_read_receipts
CREATE POLICY "Users can manage their own read receipts" ON message_read_receipts
  FOR ALL USING (auth.uid() = user_id);

-- Create user_presence table for typing indicators
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  typing_in_conversation UUID,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT user_presence_user_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT user_presence_conversation_fkey FOREIGN KEY (typing_in_conversation) REFERENCES conversations(id) ON DELETE SET NULL
);

-- Enable RLS on user_presence
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_presence
CREATE POLICY "Users can manage their own presence" ON user_presence
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view presence of conversation participants" ON user_presence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE auth.uid() = ANY(conversations.participant_ids)
      AND user_presence.user_id = ANY(conversations.participant_ids)
    )
  );

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  desktop_notifications BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  muted_conversations UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT notification_preferences_user_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Enable RLS on notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_preferences
CREATE POLICY "Users can manage their own notification preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_v2_conversation ON messages_v2(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_v2_sender ON messages_v2(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_v2_created_at ON messages_v2(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_user ON message_read_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_updated_at ON user_presence(updated_at DESC);

-- Update conversations table structure to ensure it's complete
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS conversation_type TEXT DEFAULT 'direct' CHECK (conversation_type IN ('direct', 'group', 'support')),
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Enable RLS on conversations if not already enabled
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Update conversations RLS policies
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;

CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = created_by AND auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can update their conversations" ON conversations
  FOR UPDATE USING (auth.uid() = ANY(participant_ids));

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_messages_v2_updated_at
  BEFORE UPDATE ON messages_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();

CREATE TRIGGER update_user_presence_updated_at
  BEFORE UPDATE ON user_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();