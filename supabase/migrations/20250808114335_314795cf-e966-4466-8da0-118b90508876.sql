-- Clean up duplicate Stefan conversations (fixed version)
-- This migration consolidates Stefan AI conversations to prevent duplicates

-- First, identify and merge duplicate Stefan conversations
WITH stefan_conversations AS (
  SELECT DISTINCT 
    c.id,
    c.created_by,
    c.created_at,
    ROW_NUMBER() OVER (PARTITION BY c.created_by ORDER BY c.created_at ASC) as row_num
  FROM conversations c
  WHERE LOWER(c.title) LIKE '%stefan%' 
     OR c.metadata->>'stefan_ai' = 'true'
),
duplicate_conversations AS (
  SELECT id FROM stefan_conversations WHERE row_num > 1
)
-- Mark duplicate conversations as inactive instead of deleting them
UPDATE conversations 
SET is_active = false, 
    title = title || ' (Merged)',
    updated_at = now()
WHERE id IN (SELECT id FROM duplicate_conversations);

-- Create a default Stefan AI conversation for users who don't have one
INSERT INTO conversations (
  id,
  title,
  conversation_type,
  participant_ids,
  created_by,
  is_active,
  metadata,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  'Stefan AI',
  'direct',
  ARRAY[p.id]::uuid[],
  p.id,
  true,
  jsonb_build_object(
    'ai_conversation', true,
    'stefan_ai', true,
    'auto_created', true
  ),
  now(),
  now()
FROM profiles p
WHERE p.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM conversations c 
    WHERE c.created_by = p.id 
      AND c.is_active = true
      AND (
        LOWER(c.title) LIKE '%stefan%' 
        OR c.metadata->>'stefan_ai' = 'true'
      )
  );

-- Add index for better performance on Stefan conversations
CREATE INDEX IF NOT EXISTS idx_conversations_stefan_ai 
ON conversations USING GIN(metadata) 
WHERE metadata->>'stefan_ai' = 'true';