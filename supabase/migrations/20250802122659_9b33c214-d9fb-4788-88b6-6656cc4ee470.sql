-- Först, ta bort den gamla check constraint
ALTER TABLE pillar_definitions DROP CONSTRAINT IF EXISTS pillar_definitions_pillar_key_check;

-- Lägg till en ny check constraint som inkluderar 'open_track'
ALTER TABLE pillar_definitions ADD CONSTRAINT pillar_definitions_pillar_key_check 
CHECK (pillar_key IN ('self_care', 'skills', 'talent', 'brand', 'economy', 'open_track'));

-- Nu kan vi lägga till "Öppet Spår" som en aktiv pillar definition
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
  'open_track',
  'Öppet Spår',
  'Din personliga utvecklingsresa med fritt valbara mål och förändringar. Här kan du definiera egna utvecklingsområden och få skräddarsydd coaching för dina specifika mål.',
  '🛤️',
  '#EC4899',
  'Klienten du analyserar är en offentlig person med följande profil:

- Primär roll: {primär_roll}
- Sekundär roll: {sekundär_roll}  
- Nisch: {nisch}
- Kreativa styrkor: {styrkor}
- Upplevda svagheter: {svagheter}
- Aktiva plattformar: {plattformar}
- Ålder: {ålder}
- Särskilda behov: {behov}
- Ort: {ort}
- Pågående livsförändringar: {förändringar}

Klienten har valt "Öppet spår" vilket innebär ett personligt utvecklingsmål: {change_goal}

Deras specifika situation och kapacitet:
- Tidstillgång per dag: {daily_time_commitment}
- Önskad tidsram: {total_timeframe}
- Motivationsnivå: {motivation_level}/10
- Självförtroende: {confidence_level}/10
- Nuvarande situation: {current_situation}
- Huvudutmaningar: {main_challenges}

Utifrån denna assessment-data:
{client_self_assessment_data}

Gör:
1. En reflektion över klientens specifika förändringsbehov och beredskap
2. Identifiera mönster i deras svar och tidigare försök
3. Skapa ett åtgärdsförslag i 2–3 konkreta, anpassade steg som:
   - Respekterar deras tidsbegränsningar ({daily_time_commitment})
   - Matchar deras motivationsnivå och självförtroende
   - Tar hänsyn till deras specifika utmaningar
   - Bygger på deras befintliga resurser och stödsystem
4. Använd en varm, professionell och personlig ton som erkänner deras mod att ta tag i denna förändring',
  '{"goal_clarity": 0.3, "motivation_confidence": 0.25, "capacity_realism": 0.25, "preparation_insight": 0.2}',
  true,
  5
) ON CONFLICT (pillar_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color_code = EXCLUDED.color_code,
  ai_prompt_template = EXCLUDED.ai_prompt_template,
  scoring_weights = EXCLUDED.scoring_weights,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();