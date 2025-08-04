-- Fix critical foreign key issue
ALTER TABLE public.messages_v2 
ADD CONSTRAINT messages_v2_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES public.profiles(id);

-- Ensure conversations have proper foreign key too
ALTER TABLE public.conversations 
ADD CONSTRAINT conversations_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id);

-- Add proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_v2_sender_id ON public.messages_v2(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_v2_conversation_id ON public.messages_v2(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_ids ON public.conversations USING GIN(participant_ids);

-- Ensure message_read_receipts has proper foreign keys
ALTER TABLE public.message_read_receipts 
ADD CONSTRAINT message_read_receipts_message_id_fkey 
FOREIGN KEY (message_id) REFERENCES public.messages_v2(id) ON DELETE CASCADE,
ADD CONSTRAINT message_read_receipts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- Add trigger to automatically update conversation last_message_at
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

DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages_v2;
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();