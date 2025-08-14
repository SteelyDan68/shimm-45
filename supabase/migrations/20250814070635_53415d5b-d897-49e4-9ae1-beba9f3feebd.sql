-- Skapa RPC-funktion för Stefan memory vektorsökning för enhanced AI analysis
CREATE OR REPLACE FUNCTION match_stefan_memories(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  target_user_id uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ai_memories.id,
    ai_memories.content,
    ai_memories.metadata,
    1 - (ai_memories.embedding <=> query_embedding) as similarity
  FROM ai_memories
  WHERE ai_memories.user_id = target_user_id
    AND ai_memories.source = 'stefan_ai'
    AND 1 - (ai_memories.embedding <=> query_embedding) > match_threshold
  ORDER BY ai_memories.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;