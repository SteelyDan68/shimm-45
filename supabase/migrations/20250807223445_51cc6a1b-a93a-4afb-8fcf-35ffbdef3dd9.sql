-- Update RLS policies to align with existing schema (created_by, participant_ids, sender_id)

-- Conversations: replace user-centric policy to support created_by/participants
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversations' AND policyname='Users can manage their own conversations'
  ) THEN
    DROP POLICY "Users can manage their own conversations" ON public.conversations;
  END IF;
END $$;

CREATE POLICY "Users can manage their own conversations"
ON public.conversations
FOR ALL
USING (
  auth.uid() = created_by
  OR auth.uid() = user_id
  OR (participant_ids IS NOT NULL AND auth.uid() = ANY(participant_ids))
)
WITH CHECK (
  auth.uid() = created_by
  OR auth.uid() = user_id
  OR (participant_ids IS NOT NULL AND auth.uid() = ANY(participant_ids))
);

-- Messages: use sender_id and conversation membership
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='Users can manage their own messages'
  ) THEN
    DROP POLICY "Users can manage their own messages" ON public.messages;
  END IF;
END $$;

CREATE POLICY "Users can manage their own messages"
ON public.messages
FOR ALL
USING (
  auth.uid() = sender_id
  OR EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (
        c.created_by = auth.uid()
        OR c.user_id = auth.uid()
        OR (c.participant_ids IS NOT NULL AND auth.uid() = ANY(c.participant_ids))
      )
  )
)
WITH CHECK (
  auth.uid() = sender_id
  OR EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (
        c.created_by = auth.uid()
        OR c.user_id = auth.uid()
        OR (c.participant_ids IS NOT NULL AND auth.uid() = ANY(c.participant_ids))
      )
  )
);
