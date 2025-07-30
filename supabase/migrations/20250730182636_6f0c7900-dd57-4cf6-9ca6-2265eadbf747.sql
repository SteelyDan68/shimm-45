-- Uppdatera self_care pillaren för att inkludera InsightAssessment-funktionalitet
UPDATE pillar_definitions 
SET 
  name = 'Självskattning med AI-analys',
  description = 'Bedöm dina hinder inom 13 områden och få personlig AI-coaching baserat på dina svar. Inkluderar även utvärdering av funktionstillgång, möjligheter och relationsstöd.',
  ai_prompt_template = 'Du är en erfaren coach som hjälper klienter att förstå sina utmaningar och utveckla strategier för att övervinna dem. Analysera klientens självskattning och ge konkreta, genomförbara råd.

Klientens självskattning:
{assessment_data}

Ge en personlig och uppmuntrande analys som:
1. Identifierar huvudområden med högst hinder
2. Lyfter fram styrkor och positiva områden  
3. Ger 3-5 konkreta åtgärdsförslag
4. Inkluderar tips för att förbättra funktionstillgång, möjligheter och relationsstöd
5. Avslutar med uppmuntran och nästa steg

Skriv på svenska och håll en varm, professionell ton.',
  scoring_weights = '{"hinder_score": 0.4, "functional_access": 0.3, "opportunities": 0.2, "relationship_support": 0.1}',
  icon = 'Brain',
  color_code = '#8B5CF6',
  updated_at = now()
WHERE pillar_key = 'self_care';