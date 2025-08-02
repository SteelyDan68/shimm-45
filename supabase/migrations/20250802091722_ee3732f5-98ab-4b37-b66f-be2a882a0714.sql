-- Create advanced AI coaching tables

-- Coaching sessions
CREATE TABLE IF NOT EXISTS public.ai_coaching_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL CHECK (session_type IN ('assessment', 'planning', 'review', 'emergency')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_time TIMESTAMP WITH TIME ZONE,
    context JSONB,
    recommendations JSONB,
    user_feedback JSONB,
    follow_up JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI recommendations
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.ai_coaching_sessions(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('action', 'reflection', 'learning', 'habit', 'goal')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT NOT NULL,
    estimated_time INTEGER NOT NULL DEFAULT 0,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    expected_outcome TEXT NOT NULL,
    metrics JSONB,
    resources JSONB,
    dependencies JSONB,
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'implemented', 'declined', 'expired')),
    implemented_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Coaching plans
CREATE TABLE IF NOT EXISTS public.ai_coaching_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    duration INTEGER NOT NULL DEFAULT 30, -- days
    focus_areas JSONB NOT NULL,
    weekly_goals JSONB NOT NULL,
    milestones JSONB NOT NULL,
    adaptation_triggers JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User coaching preferences
CREATE TABLE IF NOT EXISTS public.user_coaching_preferences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    communication_style TEXT NOT NULL DEFAULT 'supportive' CHECK (communication_style IN ('direct', 'supportive', 'analytical')),
    motivation_style TEXT NOT NULL DEFAULT 'progress' CHECK (motivation_style IN ('achievement', 'progress', 'social')),
    learning_style TEXT NOT NULL DEFAULT 'visual' CHECK (learning_style IN ('visual', 'auditory', 'kinesthetic')),
    notification_preferences JSONB NOT NULL DEFAULT '{}',
    coaching_frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (coaching_frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
    preferred_session_time TEXT,
    focus_priorities JSONB,
    avoid_topics JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Coaching analytics
CREATE TABLE IF NOT EXISTS public.ai_coaching_analytics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_data JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_coaching_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coaching_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_coaching_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ai_coaching_sessions
CREATE POLICY "Users can view their own coaching sessions"
ON public.ai_coaching_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own coaching sessions"
ON public.ai_coaching_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coaching sessions"
ON public.ai_coaching_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- Create RLS policies for ai_recommendations
CREATE POLICY "Users can view their own recommendations"
ON public.ai_recommendations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recommendations"
ON public.ai_recommendations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations"
ON public.ai_recommendations FOR UPDATE
USING (auth.uid() = user_id);

-- Create RLS policies for ai_coaching_plans
CREATE POLICY "Users can view their own coaching plans"
ON public.ai_coaching_plans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own coaching plans"
ON public.ai_coaching_plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coaching plans"
ON public.ai_coaching_plans FOR UPDATE
USING (auth.uid() = user_id);

-- Create RLS policies for user_coaching_preferences
CREATE POLICY "Users can view their own coaching preferences"
ON public.user_coaching_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own coaching preferences"
ON public.user_coaching_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coaching preferences"
ON public.user_coaching_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Create RLS policies for ai_coaching_analytics
CREATE POLICY "Users can view their own coaching analytics"
ON public.ai_coaching_analytics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own coaching analytics"
ON public.ai_coaching_analytics FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_coaching_sessions_user_id ON public.ai_coaching_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_coaching_sessions_type ON public.ai_coaching_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_ai_coaching_sessions_start_time ON public.ai_coaching_sessions(start_time);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id ON public.ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_session_id ON public.ai_recommendations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_status ON public.ai_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_priority ON public.ai_recommendations(priority);

CREATE INDEX IF NOT EXISTS idx_ai_coaching_plans_user_id ON public.ai_coaching_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_coaching_plans_status ON public.ai_coaching_plans(status);

CREATE INDEX IF NOT EXISTS idx_ai_coaching_analytics_user_id ON public.ai_coaching_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_coaching_analytics_type ON public.ai_coaching_analytics(metric_type);
CREATE INDEX IF NOT EXISTS idx_ai_coaching_analytics_recorded_at ON public.ai_coaching_analytics(recorded_at);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_ai_coaching_sessions_updated_at
    BEFORE UPDATE ON public.ai_coaching_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_recommendations_updated_at
    BEFORE UPDATE ON public.ai_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_coaching_plans_updated_at
    BEFORE UPDATE ON public.ai_coaching_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_coaching_preferences_updated_at
    BEFORE UPDATE ON public.user_coaching_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();