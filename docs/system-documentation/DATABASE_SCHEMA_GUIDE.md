# 🗄️ DATABASE SCHEMA COMPREHENSIVE GUIDE

**System:** SHMMS - Six Human Management Methodology System  
**Database:** Supabase PostgreSQL with Row Level Security  
**Updated:** 2025-08-14

---

## 📋 SCHEMA OVERVIEW

The SHMMS database is designed around the core principle of **user_id as Single Source of Truth** with role-based access control through metadata and assignments.

### Core Design Principles
1. **Single Source of Truth:** `user_id` is the primary identifier for all user-related data
2. **Role-Based Access:** Users get roles through `user_roles` table, not user metadata
3. **Row Level Security:** Every table has RLS policies for data protection
4. **Audit Trail:** All admin actions logged in `admin_audit_log`
5. **Soft Deletes:** Important data uses `is_active` flags instead of hard deletes

---

## 🏗️ TABLE CATEGORIES

### 1. USER MANAGEMENT & AUTHENTICATION

#### `profiles` - User Profile Information
```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    deactivated_at TIMESTAMP WITH TIME ZONE,
    deactivated_by UUID,
    deactivation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles  
    FOR UPDATE USING (auth.uid() = id);
```

#### `user_roles` - Role Assignment System
```sql
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    role app_role NOT NULL,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, role)
);

-- Custom enum for roles
CREATE TYPE app_role AS ENUM ('client', 'coach', 'admin', 'superadmin');

-- RLS Policies
CREATE POLICY "Users can view own roles" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON user_roles
    FOR ALL USING (is_admin(auth.uid()));
```

#### `coach_client_assignments` - Coach-Client Relationships
```sql
CREATE TABLE public.coach_client_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES auth.users(id),
    client_id UUID NOT NULL REFERENCES auth.users(id),
    assigned_by UUID NOT NULL REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(coach_id, client_id)
);

-- RLS Policies
CREATE POLICY "Coaches can see their assignments" ON coach_client_assignments
    FOR SELECT USING (
        auth.uid() = coach_id OR 
        auth.uid() = client_id OR 
        is_admin(auth.uid())
    );
```

---

### 2. ASSESSMENT SYSTEM

#### `assessment_rounds` - Completed Assessments
```sql
CREATE TABLE public.assessment_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    pillar_type TEXT NOT NULL,
    answers JSONB NOT NULL DEFAULT '{}',
    scores JSONB NOT NULL DEFAULT '{}',
    comments TEXT,
    ai_analysis TEXT,
    form_definition_id UUID REFERENCES assessment_form_definitions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_assessment_rounds_user_pillar 
    ON assessment_rounds(user_id, pillar_type);
CREATE INDEX idx_assessment_rounds_created_at 
    ON assessment_rounds(created_at DESC);

-- RLS Policies
CREATE POLICY "Users can view own assessments" ON assessment_rounds
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Coaches can view client assessments" ON assessment_rounds
    FOR SELECT USING (
        auth.uid() = user_id OR 
        is_coach_of_client(auth.uid(), user_id) OR
        is_admin(auth.uid())
    );
```

#### `assessment_states` - Assessment Progress Tracking
```sql
CREATE TABLE public.assessment_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    assessment_type TEXT NOT NULL,
    assessment_key TEXT,
    current_step TEXT NOT NULL,
    form_data JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    is_draft BOOLEAN NOT NULL DEFAULT true,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    abandoned_at TIMESTAMP WITH TIME ZONE,
    auto_save_count INTEGER DEFAULT 0,
    auto_saved_at TIMESTAMP WITH TIME ZONE,
    version INTEGER DEFAULT 1,
    parent_draft_id UUID REFERENCES assessment_states(id),
    conflict_resolution TEXT,
    device_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies
CREATE POLICY "Users can manage own assessment states" ON assessment_states
    FOR ALL USING (auth.uid() = user_id);
```

#### `assessment_templates` - Assessment Configuration
```sql
CREATE TABLE public.assessment_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    pillar_key TEXT NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]',
    scoring_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies
CREATE POLICY "Authenticated users can view active templates" ON assessment_templates
    FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage templates" ON assessment_templates
    FOR ALL USING (is_admin(auth.uid()));
```

---

### 3. AI INTEGRATION & COACHING

#### `ai_memories` - AI Context Storage
```sql
CREATE TABLE public.ai_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    embedding vector NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    tags TEXT[] DEFAULT ARRAY[]::text[],
    score NUMERIC,
    source TEXT NOT NULL DEFAULT 'stefan_ai',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Vector similarity search index
CREATE INDEX ON ai_memories USING hnsw (embedding vector_cosine_ops);

-- RLS Policies
CREATE POLICY "Users can manage own AI memories" ON ai_memories
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all AI memories" ON ai_memories
    FOR ALL USING (is_admin(auth.uid()));
```

#### `ai_coaching_sessions` - AI Coaching History
```sql
CREATE TABLE public.ai_coaching_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    session_type TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
    end_time TIMESTAMP WITH TIME ZONE,
    context JSONB,
    recommendations JSONB,
    user_feedback JSONB,
    follow_up JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies
CREATE POLICY "Users can view own coaching sessions" ON ai_coaching_sessions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own coaching sessions" ON ai_coaching_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### `ai_coaching_recommendations` - AI-Generated Recommendations
```sql
CREATE TABLE public.ai_coaching_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    session_id UUID REFERENCES ai_coaching_sessions(id),
    recommendation_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    priority TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    expected_outcome TEXT NOT NULL,
    estimated_time_minutes INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    due_date TIMESTAMP WITH TIME ZONE,
    implementation_date TIMESTAMP WITH TIME ZONE,
    completion_rate NUMERIC DEFAULT 0.0,
    user_rating INTEGER,
    user_notes TEXT,
    ai_adaptation_notes TEXT,
    version INTEGER DEFAULT 1,
    superseded_by UUID REFERENCES ai_coaching_recommendations(id),
    resources JSONB DEFAULT '[]',
    dependencies JSONB DEFAULT '[]',
    success_metrics JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies
CREATE POLICY "Users can manage own recommendations" ON ai_coaching_recommendations
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all recommendations" ON ai_coaching_recommendations
    FOR ALL USING (is_admin(auth.uid()));
```

---

### 4. ACTIVITY & CALENDAR MANAGEMENT

#### `calendar_actionables` - Development Tasks
```sql
CREATE TABLE public.calendar_actionables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    pillar_key TEXT NOT NULL,
    priority TEXT DEFAULT 'medium',
    completion_status TEXT DEFAULT 'pending',
    completion_percentage INTEGER DEFAULT 0,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_duration INTEGER,
    neuroplasticity_day INTEGER,
    timeline_reference TEXT,
    user_notes TEXT,
    ai_generated BOOLEAN DEFAULT true,
    ai_recommendation_id UUID REFERENCES ai_coaching_recommendations(id),
    plan_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for calendar queries
CREATE INDEX idx_calendar_actionables_user_date 
    ON calendar_actionables(user_id, scheduled_date);
CREATE INDEX idx_calendar_actionables_pillar 
    ON calendar_actionables(pillar_key);

-- RLS Policies
CREATE POLICY "Users can manage own actionables" ON calendar_actionables
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Coaches can manage client actionables" ON calendar_actionables
    FOR ALL USING (is_coach_of_client(auth.uid(), user_id));
```

#### `calendar_events` - Calendar Events
```sql
CREATE TABLE public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    category TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_by_role TEXT NOT NULL,
    visible_to_client BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies
CREATE POLICY "Users can view own calendar events" ON calendar_events
    FOR SELECT USING (
        auth.uid() = user_id OR 
        is_admin(auth.uid()) OR 
        (visible_to_client = true AND is_coach_of_client(auth.uid(), user_id))
    );
CREATE POLICY "Users can manage own calendar events" ON calendar_events
    FOR ALL USING (auth.uid() = user_id);
```

---

### 5. ANALYTICS & MONITORING

#### `analytics_events` - User Activity Tracking
```sql
CREATE TABLE public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    event TEXT NOT NULL,
    properties JSONB DEFAULT '{}',
    session_id TEXT NOT NULL,
    page_url TEXT,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX idx_analytics_events_user_timestamp 
    ON analytics_events(user_id, timestamp DESC);
CREATE INDEX idx_analytics_events_event_timestamp 
    ON analytics_events(event, timestamp DESC);

-- RLS Policies
CREATE POLICY "Users can view own analytics events" ON analytics_events
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analytics events" ON analytics_events
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Admins can view all analytics events" ON analytics_events
    FOR SELECT USING (is_admin(auth.uid()));
```

#### `analytics_metrics` - System Metrics
```sql
CREATE TABLE public.analytics_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    metric_type TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metadata JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies
CREATE POLICY "Users can view own analytics" ON analytics_metrics
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all analytics" ON analytics_metrics
    FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "System can insert analytics metrics" ON analytics_metrics
    FOR INSERT WITH CHECK (true);
```

---

### 6. ADMINISTRATIVE & AUDIT

#### `admin_audit_log` - Administrative Actions
```sql
CREATE TABLE public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    target_user_id UUID REFERENCES auth.users(id),
    details JSONB DEFAULT '{}',
    user_agent TEXT,
    ip_address INET,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies
CREATE POLICY "Superadmins can view audit logs" ON admin_audit_log
    FOR SELECT USING (is_superadmin(auth.uid()));
CREATE POLICY "System can insert audit logs" ON admin_audit_log
    FOR INSERT WITH CHECK (admin_user_id IS NULL OR auth.uid() IS NOT NULL);
```

#### `invitations` - User Invitation System
```sql
CREATE TABLE public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    invited_role TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    token TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies
CREATE POLICY "Admins can manage invitations" ON invitations
    FOR ALL USING (is_admin(auth.uid()));
```

---

## 🔧 HELPER FUNCTIONS

### Permission Check Functions
```sql
-- Check if user has specific role
CREATE OR REPLACE FUNCTION has_role(_user_id uuid, _role text)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role::app_role
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(_user_id uuid)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role IN ('admin', 'superadmin')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if user is superadmin
CREATE OR REPLACE FUNCTION is_superadmin(_user_id uuid)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = 'superadmin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check coach-client relationship
CREATE OR REPLACE FUNCTION is_coach_of_client(_coach_id uuid, _client_id uuid)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM coach_client_assignments
        WHERE coach_id = _coach_id 
        AND client_id = _client_id 
        AND is_active = true
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### Data Management Functions
```sql
-- Total pillar reset function
CREATE OR REPLACE FUNCTION total_pillar_reset(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
    deleted_assessments integer := 0;
    deleted_actionables integer := 0;
    result jsonb;
BEGIN
    -- Delete all assessment rounds
    DELETE FROM assessment_rounds WHERE user_id = p_user_id;
    GET DIAGNOSTICS deleted_assessments = ROW_COUNT;

    -- Delete all calendar actionables
    DELETE FROM calendar_actionables WHERE user_id = p_user_id;
    GET DIAGNOSTICS deleted_actionables = ROW_COUNT;

    -- Create result summary
    result := jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'cleanup_summary', jsonb_build_object(
            'deleted_assessments', deleted_assessments,
            'deleted_actionables', deleted_actionables
        ),
        'timestamp', now()
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📊 PERFORMANCE OPTIMIZATION

### Essential Indexes
```sql
-- User lookups
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- Assessment queries
CREATE INDEX idx_assessment_rounds_user_pillar ON assessment_rounds(user_id, pillar_type);
CREATE INDEX idx_assessment_states_user_type ON assessment_states(user_id, assessment_type);

-- Calendar queries
CREATE INDEX idx_calendar_actionables_user_date ON calendar_actionables(user_id, scheduled_date);
CREATE INDEX idx_calendar_events_user_date ON calendar_events(user_id, event_date);

-- Analytics queries
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX idx_analytics_metrics_type_time ON analytics_metrics(metric_type, recorded_at DESC);

-- AI vector search
CREATE INDEX ON ai_memories USING hnsw (embedding vector_cosine_ops);
```

### Query Optimization Patterns
```sql
-- Efficient user data retrieval
SELECT p.*, array_agg(ur.role) as roles
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE p.id = $1
GROUP BY p.id;

-- Coach client list with latest activity
SELECT p.*, 
       ae.timestamp as last_activity
FROM profiles p
JOIN coach_client_assignments cca ON cca.client_id = p.id
LEFT JOIN LATERAL (
    SELECT timestamp 
    FROM analytics_events 
    WHERE user_id = p.id 
    ORDER BY timestamp DESC 
    LIMIT 1
) ae ON true
WHERE cca.coach_id = $1 AND cca.is_active = true;
```

---

## 🔒 SECURITY CONSIDERATIONS

### RLS Policy Patterns
```sql
-- Standard user ownership
CREATE POLICY "users_own_data" ON table_name
    FOR ALL USING (auth.uid() = user_id);

-- Coach access to clients
CREATE POLICY "coach_client_access" ON table_name
    FOR SELECT USING (
        auth.uid() = user_id OR 
        is_coach_of_client(auth.uid(), user_id) OR
        is_admin(auth.uid())
    );

-- Admin full access
CREATE POLICY "admin_full_access" ON table_name
    FOR ALL USING (is_admin(auth.uid()));

-- System operations
CREATE POLICY "system_operations" ON table_name
    FOR INSERT WITH CHECK (true);
```

### Data Privacy
- **Personal Data:** All user data protected by RLS
- **Audit Trail:** All admin actions logged
- **Data Retention:** Configurable retention policies
- **GDPR Compliance:** Data export and deletion functions

---

**CONCLUSION:** This schema provides a robust, secure, and scalable foundation for the SHMMS system with comprehensive role-based access control and audit capabilities.

**For Development Teams:** Use this guide to understand data relationships and implement similar security patterns in your database design.