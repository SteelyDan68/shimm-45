-- Add proper indexes for performance (skip ones that might exist)
CREATE INDEX IF NOT EXISTS idx_messages_v2_conversation_id ON public.messages_v2(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_ids ON public.conversations USING GIN(participant_ids);

-- Ensure message_read_receipts has proper foreign keys
DO $$
BEGIN
    -- Add foreign key constraint for message_read_receipts -> messages_v2 if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'message_read_receipts_message_id_fkey'
        AND table_name = 'message_read_receipts'
    ) THEN
        ALTER TABLE public.message_read_receipts 
        ADD CONSTRAINT message_read_receipts_message_id_fkey 
        FOREIGN KEY (message_id) REFERENCES public.messages_v2(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key constraint for message_read_receipts -> profiles if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'message_read_receipts_user_id_fkey'
        AND table_name = 'message_read_receipts'
    ) THEN
        ALTER TABLE public.message_read_receipts 
        ADD CONSTRAINT message_read_receipts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id);
    END IF;
END $$;

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