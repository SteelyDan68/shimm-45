-- Lägg till profile_metadata fält till clients tabellen för onboarding-data
ALTER TABLE public.clients ADD COLUMN profile_metadata jsonb DEFAULT '{}'::jsonb;

-- Lägg till en kommentar för att beskriva vad profile_metadata innehåller
COMMENT ON COLUMN public.clients.profile_metadata IS 'Metadata från onboarding-processen: allmän info, offentlig roll, livskarta för AI-kontext';