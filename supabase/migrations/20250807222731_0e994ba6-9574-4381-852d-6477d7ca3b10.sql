-- Idempotent setup for conversations/messages and memory search

-- Ensure vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Utility timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Conversations: create or align columns
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'conversations'
  ) THEN
    ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS user_id uuid;
    ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS title text;
    ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS status text;
    ALTER TABLE public.conversations ALTER COLUMN status SET DEFAULT 'active';
    ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS model text;
    ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message_at timestamptz;
    ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS created_at timestamptz;
    ALTER TABLE public.conversations ALTER COLUMN created_at SET DEFAULT now();
    ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS updated_at timestamptz;
    ALTER TABLE public.conversations ALTER COLUMN updated_at SET DEFAULT now();
  ELSE
    CREATE TABLE public.conversations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid,
      title text,
      status text NOT NULL DEFAULT 'active',
      model text,
      last_message_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'Users can manage their own conversations'
  ) THEN
    CREATE POLICY "Users can manage their own conversations"
    ON public.conversations
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'Admins can manage all conversations'
  ) THEN
    CREATE POLICY "Admins can manage all conversations"
    ON public.conversations
    FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON public.conversations;
CREATE TRIGGER trg_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages: create or align columns
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'messages'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid();
    ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_id uuid;
    ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS user_id uuid;
    ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS role text;
    ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS content text;
    ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS ai_model text;
    ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS tokens integer;
    ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS metadata jsonb;
    ALTER TABLE public.messages ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;
    ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS created_at timestamptz;
    ALTER TABLE public.messages ALTER COLUMN created_at SET DEFAULT now();
  ELSE
    CREATE TABLE public.messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id uuid NOT NULL,
      user_id uuid,
      role text NOT NULL CHECK (role IN ('user','assistant','system','tool')),
      content text NOT NULL,
      ai_model text,
      tokens integer,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Ensure FK exists (no nested DO)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'messages_conversation_id_fkey' 
      AND conrelid = 'public.messages'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.messages ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE';
  END IF;
END $$;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'Users can manage their own messages'
  ) THEN
    CREATE POLICY "Users can manage their own messages"
    ON public.messages
    FOR ALL
    USING (
      auth.uid() = user_id AND EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()
      )
    )
    WITH CHECK (
      auth.uid() = user_id AND EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'Admins can manage all messages'
  ) THEN
    CREATE POLICY "Admins can manage all messages"
    ON public.messages
    FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id_created_at ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);

-- Recreate match_ai_memories RPC with hardened settings
CREATE OR REPLACE FUNCTION public.match_ai_memories(
  p_user_id uuid,
  query_embedding vector,
  match_threshold float,
  match_count int,
  filter jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  tags text[],
  score float
) AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.content, m.metadata, m.tags,
         (1 - (m.embedding <=> query_embedding)) AS score
  FROM public.ai_memories m
  WHERE m.user_id = p_user_id
    AND (1 - (m.embedding <=> query_embedding)) >= match_threshold
    AND (filter IS NULL OR filter = '{}'::jsonb OR m.metadata @> filter)
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';
