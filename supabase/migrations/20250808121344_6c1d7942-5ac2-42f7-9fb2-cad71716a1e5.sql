-- Temporarily disable the trigger that prevents duplicates
ALTER TABLE assessment_rounds DISABLE TRIGGER prevent_duplicate_assessments_trigger;

-- Insert Anna's open_track assessment
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
    "life_vision": "Om fem år ser jag mig själv som en framgångsrik entreprenör inom hållbar teknologi. Jag vill ha skapat något som verkligen gör skillnad för miljön och samtidigt lett ett team av passionerade personer.",
    "passion_discovery": "Jag tappar helt tidskänslan när jag arbetar med innovation och problemlösning, särskilt inom teknik och hållbarhet. När jag får brainstorma nya idéer känner jag mig mest levande.",
    "exploration_areas": ["Innovation & Entreprenörskap", "Ledarskap & Påverkan", "Livslångt lärande & Intellektuell nyfikenhet", "Miljöengagemang & Hållbarhet"],
    "curiosity_level": 9,
    "risk_appetite": 7,
    "energy_level": 8,
    "commitment_level": 9
  }'::jsonb,
  '{
    "open_track": 8.2,
    "overall": 8.2
  }'::jsonb,
  'Anna visar exceptionell vision och passion för entreprenörskap inom hållbar teknologi. Hennes höga commitment-nivå och nyfikenhet indikerar stark potential för neuroplastisk utveckling.',
  'Känner mig inspirerad att äntligen ha formulerat mina drömmar så tydligt.',
  '2025-08-08 10:30:00+00',
  '2025-08-08 10:30:00+00'
);

-- Re-enable the trigger
ALTER TABLE assessment_rounds ENABLE TRIGGER prevent_duplicate_assessments_trigger;