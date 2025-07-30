-- Uppdatera self_care pillar-definitionen med alla frågor från InsightAssessment
UPDATE pillar_definitions 
SET 
  name = 'Självskattning med AI-analys',
  description = 'Bedöm dina hinder inom 13 områden och få personlig AI-coaching baserat på dina svar. Inkluderar hinder, funktionstillgång, möjligheter och relationsstöd.',
  scoring_weights = '{
    "barriers": 0.4,
    "functional_access": 0.3, 
    "opportunities": 0.2,
    "relationships": 0.1
  }'::jsonb,
  ai_prompt_template = 'Analysera denna självskattning och ge personliga rekommendationer baserat på användarens svar. Fokusera på identifierade hinder och ge konkreta förslag för förbättring. Inkludera funktionstillgång, möjligheter och relationsstöd i analysen.',
  updated_at = now()
WHERE pillar_key = 'self_care';