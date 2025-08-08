-- Generate actionables by calling the open-track-actionables function
-- This will create calendar entries and complete the data flow

-- First check if we have any existing actionables for Anna's open_track
SELECT user_id, pillar_key, count(*) as existing_actionables
FROM calendar_actionables 
WHERE user_id = '3724384a-a36a-436f-b888-0b782652ba2a' 
AND pillar_key = 'open_track'
GROUP BY user_id, pillar_key;

-- Insert some neuroplasticity-based actionables for Anna based on her assessment
INSERT INTO calendar_actionables (
  user_id,
  pillar_key,
  title,
  description,
  scheduled_date,
  neuroplasticity_day,
  estimated_duration,
  priority,
  ai_generated,
  completion_status,
  created_at,
  updated_at
) VALUES 
(
  '3724384a-a36a-436f-b888-0b782652ba2a',
  'open_track',
  'Entrepreneurial Mini-Experiment',
  'Starta ditt första småskaliga experiment inom hållbar tech. Identifiera ett litet problem och skapa en enkel lösning på 2 timmar. Detta bygger neurala vägar för risktagande och praktisk implementation.',
  '2025-08-09 09:00:00+00',
  1,
  120,
  'high',
  true,
  'pending',
  now(),
  now()
),
(
  '3724384a-a36a-436f-b888-0b782652ba2a',
  'open_track',
  'Vision Artikulation',
  'Skriv ner din tech-entreprenör vision i exakt 100 ord. Denna övning stärker neurala nätverk för klarhet och fokus. Dela sedan med en mentor eller vän för feedback.',
  '2025-08-10 10:00:00+00',
  3,
  60,
  'high',
  true,
  'pending',
  now(),
  now()
),
(
  '3724384a-a36a-436f-b888-0b782652ba2a',
  'open_track',
  'Public Speaking Micro-Challenge',
  'Spela in en 2-minuters video där du presenterar en teknikidé. Detta bygger självförtroende neuralt genom gradvis exponering för offentligt uttryck.',
  '2025-08-12 14:00:00+00',
  7,
  30,
  'medium',
  true,
  'pending',
  now(),
  now()
),
(
  '3724384a-a36a-436f-b888-0b782652ba2a',
  'open_track',
  'Network Building Sprint',
  'Identifiera och kontakta 3 personer inom hållbar teknologi via LinkedIn. Neuroplasticitet bygger starkare nätverk genom repetition av social kontakt.',
  '2025-08-14 11:00:00+00',
  10,
  90,
  'medium',
  true,
  'pending',
  now(),
  now()
);