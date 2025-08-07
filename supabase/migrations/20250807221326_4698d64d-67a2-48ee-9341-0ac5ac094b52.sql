-- Harden match_ai_memories with explicit search_path
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;