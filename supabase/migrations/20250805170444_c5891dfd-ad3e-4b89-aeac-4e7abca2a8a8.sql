-- SÄKERHETSKOPIERA OCH TA BORT GAMLA TABELLER

-- Backup data först (för säkerhets skull)
CREATE TABLE IF NOT EXISTS backup_user_roles AS SELECT * FROM public.user_roles;
CREATE TABLE IF NOT EXISTS backup_coach_client_assignments AS SELECT * FROM public.coach_client_assignments;

-- Ta bort gamla tabeller (CASCADE för att ta bort beroenden)
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.coach_client_assignments CASCADE;

-- Ta bort gamla enum om den inte används
-- DROP TYPE IF EXISTS public.app_role CASCADE;