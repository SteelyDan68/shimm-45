-- 🚀 PERFORMANCE OPTIMIZATION - SLUTGILTIG DATABASE INDEXERING
-- Phase 2: Använder endast existerande tabeller

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
CREATE INDEX IF NOT EXISTS idx_assessment_rounds_recent ON public.assessment_rounds (user_id, created_at DESC, pillar_type) 
  WHERE created_at > now() - interval '6 months';

-- 4. AI_CONVERSATIONS OPTIMIZATION (om tabellen finns)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_conversations' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id_created ON public.ai_conversations (user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ai_conversations_recent ON public.ai_conversations (user_id, created_at DESC)
      WHERE created_at > now() - interval '3 months';
  END IF;
END $$;

-- 5. PROFILES OPTIMIZATION
-- For user management and search
CREATE INDEX IF NOT EXISTS idx_profiles_email_active ON public.profiles (email) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_active_created ON public.profiles (is_active, created_at DESC);

-- 6. PROFILE_METADATA OPTIMIZATION (om tabellen finns)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_metadata' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_profile_metadata_user_id ON public.profile_metadata (user_id);
    CREATE INDEX IF NOT EXISTS idx_profile_metadata_key ON public.profile_metadata (metadata_key, user_id);
  END IF;
END $$;

-- 7. PATH_ENTRIES OPTIMIZATION (om tabellen finns)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'path_entries' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_path_entries_user_id_type ON public.path_entries (user_id, type, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_path_entries_status ON public.path_entries (status, user_id) WHERE status != 'inactive';
  END IF;
END $$;

-- 8. TASKS OPTIMIZATION (om tabellen finns)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_tasks_user_id_status ON public.tasks (user_id, status, due_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_assigned_date ON public.tasks (assigned_by, created_at DESC) WHERE assigned_by IS NOT NULL;
  END IF;
END $$;

-- 9. ORGANIZATION_MEMBERS OPTIMIZATION (om tabellen finns)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_members' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_organization_members_org_user ON public.organization_members (organization_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_organization_members_role ON public.organization_members (role, organization_id);
  END IF;
END $$;

-- 10. UPDATE STATISTICS FOR OPTIMAL QUERY PLANNING
ANALYZE public.user_roles;
ANALYZE public.coach_client_assignments;
ANALYZE public.assessment_rounds;
ANALYZE public.profiles;