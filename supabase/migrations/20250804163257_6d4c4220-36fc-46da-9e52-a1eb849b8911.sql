-- Modern Enterprise Message System 2025
-- Complete rebuild with world-class architecture

-- Drop existing problematic tables and policies
DROP POLICY IF EXISTS "Coach client message sending" ON messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON messages;
DROP TABLE IF EXISTS message_preferences CASCADE;
DROP TABLE IF EXISTS messages CASCADE;

-- Create modern message system with simplified security
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_ids UUID[] NOT NULL,
  conversation_type TEXT NOT NULL DEFAULT 'direct', -- 'direct', 'group', 'support'
  title TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.messages_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'emoji', 'file', 'voice', 'system'
  parent_message_id UUID REFERENCES messages_v2(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  reactions JSONB DEFAULT '{}'::jsonb, -- {user_id: emoji}
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.message_read_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages_v2(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

CREATE TABLE public.user_presence (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'offline', -- 'online', 'away', 'busy', 'offline'
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  typing_in_conversation UUID REFERENCES conversations(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.notification_preferences (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  desktop_notifications BOOLEAN NOT NULL DEFAULT true,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  muted_conversations UUID[] DEFAULT ARRAY[]::UUID[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Simple, powerful RLS policies based on "Single Source of Truth" principle
CREATE POLICY "Users can access conversations they participate in" 
ON conversations FOR ALL 
USING (
  auth.uid() = ANY(participant_ids) OR 
  auth.uid() = created_by OR 
  is_admin(auth.uid())
);

CREATE POLICY "Users can access messages in their conversations" 
ON messages_v2 FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages_v2.conversation_id 
    AND (auth.uid() = ANY(participant_ids) OR auth.uid() = created_by OR is_admin(auth.uid()))
  )
);

CREATE POLICY "Users can manage their own read receipts" 
ON message_read_receipts FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view all user presence" 
ON user_presence FOR SELECT USING (true);

CREATE POLICY "Users can insert their own presence" 
ON user_presence FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presence status" 
ON user_presence FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notification preferences" 
ON notification_preferences FOR ALL 
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_conversations_participants ON conversations USING GIN(participant_ids);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX idx_messages_conversation ON messages_v2(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages_v2(sender_id);
CREATE INDEX idx_read_receipts_message ON message_read_receipts(message_id);
CREATE INDEX idx_read_receipts_user ON message_read_receipts(user_id);
CREATE INDEX idx_user_presence_status ON user_presence(status, last_seen);

-- Triggers for real-time updates
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET last_message_at = NEW.created_at,
      updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

CREATE OR REPLACE FUNCTION update_updated_at_messages()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_messages_updated_at
  BEFORE UPDATE ON messages_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_messages();

CREATE TRIGGER trigger_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_messages();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages_v2;
ALTER PUBLICATION supabase_realtime ADD TABLE message_read_receipts;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;

-- Set replica identity for complete row data
ALTER TABLE conversations REPLICA IDENTITY FULL;
ALTER TABLE messages_v2 REPLICA IDENTITY FULL;
ALTER TABLE message_read_receipts REPLICA IDENTITY FULL;
ALTER TABLE user_presence REPLICA IDENTITY FULL;