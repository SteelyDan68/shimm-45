-- CRITICAL FIX: Clean up legacy tasks and improve task prioritization
-- Remove outdated tasks that are artifacts from previous functionality

-- Delete old generic tasks that are not related to recent assessments
DELETE FROM tasks 
WHERE ai_generated = true 
  AND created_at < (NOW() - INTERVAL '30 days')
  AND title ILIKE '%wheel of life%'
  OR title ILIKE '%generic%'
  OR description ILIKE '%generic%';

-- Update task priority logic function
CREATE OR REPLACE FUNCTION public.calculate_task_priority(
  user_assessment_score NUMERIC,
  task_category TEXT,
  user_input_urgency TEXT DEFAULT 'medium'
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- High priority tasks
  IF user_assessment_score < 4 AND user_input_urgency = 'high' THEN
    RETURN 'high';
  END IF;
  
  -- Medium priority (most common)
  IF user_assessment_score BETWEEN 4 AND 7 AND user_input_urgency IN ('medium', 'high') THEN
    RETURN 'medium';
  END IF;
  
  -- Low priority
  IF user_assessment_score > 7 OR user_input_urgency = 'low' THEN
    RETURN 'low';
  END IF;
  
  -- Default to medium
  RETURN 'medium';
END;
$$;