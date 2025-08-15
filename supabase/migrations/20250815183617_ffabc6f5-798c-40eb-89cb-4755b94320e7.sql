-- Clean up old generic tasks and add proper task prioritization
-- Fix task generation and calendar integration issues

-- 1. Delete old generic/legacy tasks that are not from current system
DELETE FROM calendar_actionables 
WHERE ai_generated = true 
  AND (
    title ILIKE '%generic%' 
    OR title ILIKE '%wheel of life%' 
    OR description ILIKE '%placeholder%'
    OR created_at < NOW() - INTERVAL '7 days'
  );

-- 2. Update task prioritization function to be more granular
CREATE OR REPLACE FUNCTION calculate_dynamic_task_priority(
  user_assessment_score numeric,
  task_category text,
  user_input_urgency text DEFAULT 'medium'::text,
  pillar_score numeric DEFAULT 5.0
) RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  -- High priority: Critical areas (score < 4) or high urgency + low pillar score
  IF (user_assessment_score < 4 AND pillar_score < 4) OR 
     (user_input_urgency = 'high' AND pillar_score < 5) THEN
    RETURN 'high';
  END IF;
  
  -- Medium priority: Moderate scores with growth potential
  IF (user_assessment_score BETWEEN 4 AND 6) OR 
     (user_input_urgency = 'medium' AND pillar_score BETWEEN 4 AND 7) THEN
    RETURN 'medium';
  END IF;
  
  -- Low priority: Strong areas or maintenance tasks
  RETURN 'low';
END;
$$;

-- 3. Fix calendar integration by creating proper calendar events table relationships
CREATE INDEX IF NOT EXISTS idx_calendar_actionables_user_pillar 
ON calendar_actionables(user_id, pillar_key);

CREATE INDEX IF NOT EXISTS idx_calendar_actionables_scheduled_date 
ON calendar_actionables(scheduled_date) 
WHERE scheduled_date IS NOT NULL;

-- 4. Update task distribution to avoid January 2025 backlog
UPDATE calendar_actionables 
SET scheduled_date = CASE 
  WHEN scheduled_date IS NULL OR scheduled_date < NOW() THEN
    -- Distribute over next 8 weeks starting from next Monday
    DATE_TRUNC('week', NOW()) + INTERVAL '1 week' + 
    (EXTRACT(DOW FROM created_at)::integer % 7) * INTERVAL '1 day' +
    (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) % 56) * INTERVAL '1 day'
  ELSE scheduled_date
END
WHERE ai_generated = true 
  AND (scheduled_date IS NULL OR scheduled_date < NOW());