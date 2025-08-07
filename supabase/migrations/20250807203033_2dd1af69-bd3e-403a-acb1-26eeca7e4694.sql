-- 🚀 PERFORMANCE OPTIMIZATION - KÄRNINDEX ENDAST
-- Phase 2: Endast kritiska index för bevisade tabeller

-- 1. USER_ROLES TABLE OPTIMIZATION (MEST KRITISK)
-- Most critical for RLS policies and role checking  
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles (user_id, role);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles (role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active_coaches ON public.user_roles (user_id) WHERE role = 'coach';
CREATE INDEX IF NOT EXISTS idx_user_roles_active_clients ON public.user_roles (user_id) WHERE role = 'client';

-- 2. COACH_CLIENT_ASSIGNMENTS OPTIMIZATION
-- Critical for coach dashboard and client intelligence
CREATE INDEX IF NOT EXISTS idx_coach_client_assignments_coach_id ON public.coach_client_assignments (coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_client_assignments_client_id ON public.coach_client_assignments (client_id);
CREATE INDEX IF NOT EXISTS idx_coach_client_assignments_active ON public.coach_client_assignments (coach_id, client_id) WHERE is_active = true;

-- 3. ASSESSMENT_ROUNDS OPTIMIZATION  
-- For fast pillar data retrieval and analytics
CREATE INDEX IF NOT EXISTS idx_assessment_rounds_user_id_created ON public.assessment_rounds (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessment_rounds_pillar_user ON public.assessment_rounds (pillar_type, user_id);

-- 4. PROFILES OPTIMIZATION
-- For user management and search
CREATE INDEX IF NOT EXISTS idx_profiles_email_active ON public.profiles (email) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_active_created ON public.profiles (is_active, created_at DESC);

-- 5. UPDATE STATISTICS FOR OPTIMAL QUERY PLANNING
ANALYZE public.user_roles;
ANALYZE public.coach_client_assignments;
ANALYZE public.assessment_rounds;
ANALYZE public.profiles;