-- Create a realistic open_track assessment for Anna based on her profile
INSERT INTO assessment_rounds (
  id,
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
  gen_random_uuid(),
  '3724384a-a36a-436f-b888-0b782652ba2a',
  '3724384a-a36a-436f-b888-0b782652ba2a',
  'open_track',
  '{
    "life_vision": "Om fem år ser jag mig själv som en framgångsrik entreprenör inom hållbar teknologi. Jag vill ha skapat något som verkligen gör skillnad för miljön och samtidigt lett ett team av passionerade personer. Jag drömmer om att ha balans mellan arbete och privatliv, där jag kan resa och utforska världen samtidigt som jag bygger något meningsfullt.",
    "passion_discovery": "Jag tappar helt tidskänslan när jag arbetar med innovation och problemlösning, särskilt inom teknik och hållbarhet. När jag får brainstorma nya idéer eller när jag lär mig något helt nytt känner jag mig mest levande. Även när jag mentorerar andra och ser dem växa.",
    "untapped_potential": "Jag har alltid velat starta ett eget teknikföretag men aldrig vågat ta steget fullt ut. Även att tala på stora konferenser - jag vet att jag har mycket att bidra med men nervositeten har hållit mig tillbaka.",
    "legacy_desire": "Jag vill påverka nästa generation av kvinnliga teknikentreprenörer. Visa att det går att kombinera teknik med social påverkan och skapa något som faktiskt förbättrar världen. Jag vill vara en förebild som visar att man kan lyckas utan att kompromissa med sina värderingar.",
    "exploration_areas": ["Innovation & Entreprenörskap", "Ledarskap & Påverkan", "Livslångt lärande & Intellektuell nyfikenhet", "Miljöengagemang & Hållbarhet", "Syfte & Meningsfullhet"],
    "curiosity_level": 9,
    "risk_appetite": 7,
    "innovation_style": "Tillsammans med andra",
    "time_availability": "8-15 timmar per vecka",
    "energy_level": 8,
    "support_system": 7,
    "obstacles": ["Rädsla för misslyckande", "Bristande självförtroende", "Ekonomiska begränsningar"],
    "priority_focus": "Innovation & Entreprenörskap - jag känner att det är dags att ta steget och våga satsa på mina idéer inom hållbar teknologi.",
    "success_metrics": "Konkreta milstolpar som att ha lanserat en MVP, fått mina första kunder, och byggt ett team. Personligt mäter jag framsteg genom min självkänsla och mod att ta risker.",
    "commitment_level": 9,
    "preferred_timeline": "10 veckor - Grundlig transformation",
    "additional_thoughts": "Jag är redo för förändring och vill verkligen pusha mina gränser. Har känt mig fast i gamla mönster och vet att jag behöver struktur och stöd för att ta nästa steg i min karriär."
  }'::jsonb,
  '{
    "open_track": 8.2,
    "overall": 8.2,
    "vision_clarity": 9.0,
    "exploration_willingness": 8.5,
    "capacity_readiness": 7.3,
    "commitment_strength": 9.0
  }'::jsonb,
  'Anna visar en exceptionellt stark vision och passion för entreprenörskap inom hållbar teknologi. Hennes svar avslöjar en person med djup reflektion kring sitt syfte och tydliga mål. Det som sticker ut är hennes höga commitment-nivå (9/10) kombinerat med stark nyfikenhet och innovations-mindset.

STARKA OMRÅDEN:
• Kristallklar vision för framtiden inom tech/hållbarhet
• Hög energinivå och stark drivkraft  
• Tydligt syfte att påverka nästa generation kvinnliga entreprenörer
• Utmärkt självinsikt kring sina utvecklingsområden

UTVECKLINGSOMRÅDEN:
• Hantera rädsla för misslyckande - detta hindrar henne från att ta fullt ut steget
• Bygga självförtroende för offentligt talande och ledarskap
• Adressera ekonomiska oro som kan begränsa entreprenöriella satsningar

NEUROPLASTISKA REKOMMENDATIONER:
Anna är redo för djup transformation (10-veckorsprogrammet). Hennes hjärna visar hög plasticitet genom stark nyfikenhet och öppenhet för lärande. Fokus bör ligga på att bygga nya neurala vägar kring risktagande och självförtroende genom gradvis exponering och framgångsspiraler.

HANDLINGSPLAN:
1. Starta med småskaliga entreprenöriella experiment för att bygga självförtroende
2. Utveckla public speaking-färdigheter genom strukturerad träning
3. Skapa ett starkt nätverk av mentorer och likasinnade
4. Etablera finansiell strategi för entrepreneuriella satsningar',
  'Känner mig verkligen inspirerad efter denna reflektion. Det är första gången jag artikulerat mina drömmar så tydligt och jag ser nu hur pass redo jag faktiskt är för förändring.',
  '2025-08-08 10:30:00+00',
  '2025-08-08 10:30:00+00'
)
ON CONFLICT (user_id, pillar_type) DO UPDATE SET
  answers = EXCLUDED.answers,
  scores = EXCLUDED.scores,
  ai_analysis = EXCLUDED.ai_analysis,
  comments = EXCLUDED.comments,
  updated_at = EXCLUDED.updated_at;