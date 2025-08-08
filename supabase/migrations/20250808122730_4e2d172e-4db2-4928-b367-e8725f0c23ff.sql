-- Ta bort den systemgenererade duplicaten för open_track assessment
DELETE FROM assessment_rounds 
WHERE id = '55ef40cd-eacf-4712-9a6a-1d23c87961e6'
AND pillar_type = 'open_track'
AND comments LIKE '%Öppna spåret assessment slutförd%';

-- Skapa en unik constraint för att förhindra duplicates per user/pillar kombination
ALTER TABLE assessment_rounds 
ADD CONSTRAINT unique_user_pillar UNIQUE (user_id, pillar_type);

-- Skapa en funktion för att säkert ersätta assessment (för retakes)
CREATE OR REPLACE FUNCTION public.safe_assessment_upsert(
  p_user_id uuid,
  p_pillar_type text,
  p_answers jsonb,
  p_scores jsonb,
  p_comments text DEFAULT NULL,
  p_ai_analysis text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  assessment_id uuid;
BEGIN
  -- Delete existing assessment for this user/pillar combination
  DELETE FROM assessment_rounds 
  WHERE user_id = p_user_id AND pillar_type = p_pillar_type;
  
  -- Create new assessment
  INSERT INTO assessment_rounds (
    user_id,
    created_by,
    pillar_type,
    answers,
    scores,
    comments,
    ai_analysis
  ) VALUES (
    p_user_id,
    p_user_id,
    p_pillar_type,
    p_answers,
    p_scores,
    p_comments,
    p_ai_analysis
  ) RETURNING id INTO assessment_id;
  
  RETURN assessment_id;
END;
$$;