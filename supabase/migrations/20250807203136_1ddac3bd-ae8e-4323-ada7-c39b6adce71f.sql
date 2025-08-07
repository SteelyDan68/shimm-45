-- 🚀 PERFORMANCE OPTIMIZATION - MINIMALA MEN KRITISKA INDEXES
-- Phase 2: Endast säkra kolumner och tabeller

-- 1. USER_ROLES TABLE OPTIMIZATION (ABSOLUT KRITISK)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles (user_id, role);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles (role);

-- 2. COACH_CLIENT_ASSIGNMENTS OPTIMIZATION (KRITISK FÖR INTELLIGENCE)
CREATE INDEX IF NOT EXISTS idx_coach_client_assignments_coach_id ON public.coach_client_assignments (coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_client_assignments_client_id ON public.coach_client_assignments (client_id);
CREATE INDEX IF NOT EXISTS idx_coach_client_assignments_active ON public.coach_client_assignments (coach_id, client_id) WHERE is_active = true;

-- 3. ASSESSMENT_ROUNDS OPTIMIZATION (KRITISK FÖR PILLAR DATA)
CREATE INDEX IF NOT EXISTS idx_assessment_rounds_user_id ON public.assessment_rounds (user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_rounds_user_created ON public.assessment_rounds (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessment_rounds_pillar_user ON public.assessment_rounds (pillar_type, user_id);

-- 4. PROFILES OPTIMIZATION (GRUNDLÄGGANDE)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles (is_active) WHERE is_active = true;

-- 5. UPDATE CRITICAL STATISTICS
ANALYZE public.user_roles;
ANALYZE public.coach_client_assignments;
ANALYZE public.assessment_rounds;
ANALYZE public.profiles;