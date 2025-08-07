-- Messaging and AI Memory schema + search function
-- 1) Enum for message roles
DO $$ BEGIN
  CREATE TYPE public.message_role AS ENUM ('user','assistant','coach','system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  participant_ids UUID[] NOT NULL,
  title TEXT,
  last_message_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations USING GIN (participant_ids);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations (last_message_at DESC);

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON public.conversations;
CREATE TRIGGER trg_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_prd_updated_at();

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY IF NOT EXISTS "conversations_admin_manage" ON public.conversations
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS "conversations_superadmin_manage" ON public.conversations
  FOR ALL USING (superadmin_god_mode(auth.uid())) WITH CHECK (superadmin_god_mode(auth.uid()));

CREATE POLICY IF NOT EXISTS "conversations_participants_select" ON public.conversations
  FOR SELECT USING (auth.uid() = ANY(participant_ids));

CREATE POLICY IF NOT EXISTS "conversations_participants_insert" ON public.conversations
  FOR INSERT WITH CHECK (created_by = auth.uid() AND auth.uid() = ANY(participant_ids));

CREATE POLICY IF NOT EXISTS "conversations_owner_update" ON public.conversations
  FOR UPDATE USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- 3) Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  role public.message_role NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  attachments JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages (sender_id);

DROP TRIGGER IF EXISTS trg_messages_updated_at ON public.messages;
CREATE TRIGGER trg_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_prd_updated_at();

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for messages
CREATE POLICY IF NOT EXISTS "messages_admin_manage" ON public.messages
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS "messages_superadmin_manage" ON public.messages
  FOR ALL USING (superadmin_god_mode(auth.uid())) WITH CHECK (superadmin_god_mode(auth.uid()));

CREATE POLICY IF NOT EXISTS "messages_participants_select" ON public.messages
  FOR SELECT USING (
    auth.uid() = ANY((SELECT participant_ids FROM public.conversations c WHERE c.id = messages.conversation_id))
  );

CREATE POLICY IF NOT EXISTS "messages_participants_insert" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND auth.uid() = ANY((SELECT participant_ids FROM public.conversations c WHERE c.id = messages.conversation_id))
  );

CREATE POLICY IF NOT EXISTS "messages_sender_update" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid()) WITH CHECK (sender_id = auth.uid());

-- 4) AI Memories table for vector search
CREATE TABLE IF NOT EXISTS public.ai_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  source TEXT NOT NULL DEFAULT 'stefan_ai',
  tags TEXT[] DEFAULT ARRAY[]::text[],
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  score NUMERIC NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_memories_embedding ON public.ai_memories USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_ai_memories_user ON public.ai_memories (user_id, created_at DESC);

ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "ai_memories_admin_manage" ON public.ai_memories
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS "ai_memories_user_manage" ON public.ai_memories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5) RPC for vector similarity search
CREATE OR REPLACE FUNCTION public.match_ai_memories(
  p_user_id uuid,
  p_query_embedding vector(1536),
  p_match_count int DEFAULT 5,
  p_min_similarity float DEFAULT 0.75
)
RETURNS TABLE (
  id uuid,
  content text,
  source text,
  tags text[],
  metadata jsonb,
  created_at timestamptz,
  similarity float
) AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.source,
    m.tags,
    m.metadata,
    m.created_at,
    (1 - (m.embedding <=> p_query_embedding))::float as similarity
  FROM public.ai_memories m
  WHERE m.user_id = p_user_id
  ORDER BY m.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;