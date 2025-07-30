-- Lägg till Självskattning som en pillar definition
INSERT INTO pillar_definitions (
  pillar_key,
  name,
  description,
  icon,
  color_code,
  ai_prompt_template,
  scoring_weights,
  is_active,
  sort_order
) VALUES (
  'insight_assessment',
  'Självskattning med AI-analys',
  'Bedöm dina hinder inom 13 områden och få personlig AI-coaching baserat på dina svar. Inkluderar även utvärdering av funktionstillgång, möjligheter och relationsstöd.',
  'Brain',
  '#8B5CF6',
  'Du är en erfaren coach som hjälper klienter att förstå sina utmaningar och utveckla strategier för att övervinna dem. Analysera klientens självskattning och ge konkreta, genomförbara råd.

Klientens självskattning:
{assessment_data}

Ge en personlig och uppmuntrande analys som:
1. Identifierar huvudområden med högst hinder
2. Lyfter fram styrkor och positiva områden
3. Ger 3-5 konkreta åtgärdsförslag
4. Inkluderar tips för att förbättra funktionstillgång, möjligheter och relationsstöd
5. Avslutar med uppmuntran och nästa steg

Skriv på svenska och håll en varm, professionell ton.',
  '{"hinder_score": 0.4, "functional_access": 0.3, "opportunities": 0.2, "relationship_support": 0.1}',
  true,
  6
) ON CONFLICT (pillar_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  ai_prompt_template = EXCLUDED.ai_prompt_template,
  scoring_weights = EXCLUDED.scoring_weights,
  updated_at = now();