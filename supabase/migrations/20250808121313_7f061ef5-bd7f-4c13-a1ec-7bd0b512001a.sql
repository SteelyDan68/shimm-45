-- First add unique constraint on user_id, pillar_type
ALTER TABLE assessment_rounds 
ADD CONSTRAINT unique_user_pillar UNIQUE (user_id, pillar_type);

-- Create a realistic open_track assessment for Anna
INSERT INTO assessment_rounds (
  user_id,
  created_by,
  pillar_type,
  answers,
  scores,
  ai_analysis,
  comments,
  created_at,
  updated_at
) VALUES (
  '3724384a-a36a-436f-b888-0b782652ba2a',
  '3724384a-a36a-436f-b888-0b782652ba2a',
  'open_track',
  '{
    "life_vision": "Om fem år ser jag mig själv som en framgångsrik entreprenör inom hållbar teknologi. Jag vill ha skapat något som verkligen gör skillnad för miljön och samtidigt lett ett team av passionerade personer. Jag drömmer om att ha balans mellan arbete och privatliv, där jag kan resa och utforska världen samtidigt som jag bygger något meningsfullt.",
    "passion_discovery": "Jag tappar helt tidskänslan när jag arbetar med innovation och problemlösning, särskilt inom teknik och hållbarhet. När jag får brainstorma nya idéer eller när jag lär mig något helt nytt känner jag mig mest levande. Även när jag mentorerar andra och ser dem växa.",
    "exploration_areas": ["Innovation & Entreprenörskap", "Ledarskap & Påverkan", "Livslångt lärande & Intellektuell nyfikenhet", "Miljöengagemang & Hållbarhet", "Syfte & Meningsfullhet"],
    "curiosity_level": 9,
    "risk_appetite": 7,
    "energy_level": 8,
    "commitment_level": 9
  }'::jsonb,
  '{
    "open_track": 8.2,
    "overall": 8.2,
    "vision_clarity": 9.0,
    "exploration_willingness": 8.5,
    "commitment_strength": 9.0
  }'::jsonb,
  'Anna visar exceptionell vision och passion för entreprenörskap inom hållbar teknologi. Hennes höga commitment-nivå och nyfikenhet indikerar stark potential för neuroplastisk utveckling. Fokusområden: självförtroende, riskhantering, och praktisk implementation av idéer.',
  'Känner mig inspirerad att äntligen ha formulerat mina drömmar så tydligt.',
  '2025-08-08 10:30:00+00',
  '2025-08-08 10:30:00+00'
)
ON CONFLICT (user_id, pillar_type) DO UPDATE SET
  answers = EXCLUDED.answers,
  scores = EXCLUDED.scores,
  ai_analysis = EXCLUDED.ai_analysis,
  updated_at = now();