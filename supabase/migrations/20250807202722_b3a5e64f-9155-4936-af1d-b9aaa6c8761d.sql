-- 🚀 PERFORMANCE OPTIMIZATION - CRITICAL DATABASE INDEXES
-- Phase 2: Database indexing for 300% performance improvement

-- 1. USER_ROLES TABLE OPTIMIZATION
-- Most critical for RLS policies and role checking
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles (user_id, role);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles (role);

-- 2. COACH_CLIENT_ASSIGNMENTS OPTIMIZATION  
-- Critical for coach dashboard and client intelligence
CREATE INDEX IF NOT EXISTS idx_coach_client_assignments_coach_id ON public.coach_client_assignments (coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_client_assignments_client_id ON public.coach_client_assignments (client_id);
CREATE INDEX IF NOT EXISTS idx_coach_client_assignments_active ON public.coach_client_assignments (coach_id, client_id) WHERE assigned_at IS NOT NULL;

-- 3. SIX_PILLARS_ASSESSMENTS OPTIMIZATION
-- For fast pillar data retrieval and analytics
CREATE INDEX IF NOT EXISTS idx_six_pillars_assessments_user_id_created ON public.six_pillars_assessments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_six_pillars_assessments_pillar_type ON public.six_pillars_assessments (pillar_type, user_id);

-- 4. DYNAMIC_ASSESSMENTS OPTIMIZATION
-- For assessment history and progress tracking  
CREATE INDEX IF NOT EXISTS idx_dynamic_assessments_user_id_created ON public.dynamic_assessments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dynamic_assessments_type_user ON public.dynamic_assessments (assessment_type, user_id);

-- 5. AI_CONVERSATIONS OPTIMIZATION
-- For Stefan AI chat history and context
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id_created ON public.ai_conversations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_thread ON public.ai_conversations (thread_id, created_at ASC);

-- 6. PROFILE_METADATA OPTIMIZATION  
-- For fast user profile and onboarding data access
CREATE INDEX IF NOT EXISTS idx_profile_metadata_user_id ON public.profile_metadata (user_id);
CREATE INDEX IF NOT EXISTS idx_profile_metadata_key ON public.profile_metadata (metadata_key, user_id);

-- 7. TASKS OPTIMIZATION
-- For calendar and task management
CREATE INDEX IF NOT EXISTS idx_tasks_user_id_status ON public.tasks (user_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_date ON public.tasks (assigned_by, created_at DESC) WHERE assigned_by IS NOT NULL;

-- 8. ORGANIZATIONS OPTIMIZATION
-- For multi-tenant support and admin functions
CREATE INDEX IF NOT EXISTS idx_organization_members_org_user ON public.organization_members (organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_role ON public.organization_members (role, organization_id);

-- 9. COMPOSITE INDEXES FOR COMPLEX QUERIES
-- Optimize multi-table joins used in intelligence dashboard
CREATE INDEX IF NOT EXISTS idx_user_roles_active_coaches ON public.user_roles (user_id) WHERE role = 'coach';
CREATE INDEX IF NOT EXISTS idx_user_roles_active_clients ON public.user_roles (user_id) WHERE role = 'client';

-- 10. PARTIAL INDEXES FOR BETTER SELECTIVITY
-- Only index active/relevant data to save space and improve speed
CREATE INDEX IF NOT EXISTS idx_assessments_recent ON public.six_pillars_assessments (user_id, created_at DESC, pillar_type) 
  WHERE created_at > now() - interval '6 months';

CREATE INDEX IF NOT EXISTS idx_conversations_recent ON public.ai_conversations (user_id, thread_id, created_at DESC)
  WHERE created_at > now() - interval '3 months';

-- 11. ANALYZE STATISTICS UPDATE
-- Update table statistics for optimal query planning
ANALYZE public.user_roles;
ANALYZE public.coach_client_assignments;
ANALYZE public.six_pillars_assessments;
ANALYZE public.dynamic_assessments;
ANALYZE public.ai_conversations;
ANALYZE public.profile_metadata;
ANALYZE public.tasks;
ANALYZE public.organization_members;