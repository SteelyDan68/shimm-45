-- Trigger AI analysis för incomplete assessment (Brand för Anna)
UPDATE assessment_rounds 
SET ai_analysis = 'Processing...'
WHERE user_id = '3724384a-a36a-436f-b888-0b782652ba2a' 
  AND pillar_type = 'brand' 
  AND (ai_analysis IS NULL OR ai_analysis = '');