-- Fix RLS policies to avoid ANY(uuid[]), use array contains and EXISTS
-- Conversations policies
DROP POLICY IF EXISTS "conversations_participants_select" ON public.conversations;
DROP POLICY IF EXISTS "conversations_participants_insert" ON public.conversations;
DROP POLICY IF EXISTS "conversations_owner_update" ON public.conversations;
DROP POLICY IF EXISTS "conversations_admin_manage" ON public.conversations;
DROP POLICY IF EXISTS "conversations_superadmin_manage" ON public.conversations;

CREATE POLICY "conversations_admin_manage" ON public.conversations
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "conversations_superadmin_manage" ON public.conversations
  FOR ALL USING (superadmin_god_mode(auth.uid())) WITH CHECK (superadmin_god_mode(auth.uid()));

CREATE POLICY "conversations_participants_select" ON public.conversations
  FOR SELECT USING (participant_ids @> ARRAY[auth.uid()]::uuid[]);

CREATE POLICY "conversations_participants_insert" ON public.conversations
  FOR INSERT WITH CHECK (created_by = auth.uid() AND participant_ids @> ARRAY[auth.uid()]::uuid[]);

CREATE POLICY "conversations_owner_update" ON public.conversations
  FOR UPDATE USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- Messages policies
DROP POLICY IF EXISTS "messages_participants_select" ON public.messages;
DROP POLICY IF EXISTS "messages_participants_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_sender_update" ON public.messages;
DROP POLICY IF EXISTS "messages_admin_manage" ON public.messages;
DROP POLICY IF EXISTS "messages_superadmin_manage" ON public.messages;

CREATE POLICY "messages_admin_manage" ON public.messages
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "messages_superadmin_manage" ON public.messages
  FOR ALL USING (superadmin_god_mode(auth.uid())) WITH CHECK (superadmin_god_mode(auth.uid()));

CREATE POLICY "messages_participants_select" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND c.participant_ids @> ARRAY[auth.uid()]::uuid[]
    )
  );

CREATE POLICY "messages_participants_insert" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND c.participant_ids @> ARRAY[auth.uid()]::uuid[]
    )
  );

CREATE POLICY "messages_sender_update" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid()) WITH CHECK (sender_id = auth.uid());

-- AI Memories policies remain but ensure re-created idempotently
DROP POLICY IF EXISTS "ai_memories_admin_manage" ON public.ai_memories;
DROP POLICY IF EXISTS "ai_memories_user_manage" ON public.ai_memories;

CREATE POLICY "ai_memories_admin_manage" ON public.ai_memories
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "ai_memories_user_manage" ON public.ai_memories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id());