-- Fix database security issues identified by linter

-- 1. Fix functions without proper search_path
CREATE OR REPLACE FUNCTION public.vector_avg(double precision[])
 RETURNS vector
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
 SECURITY DEFINER
 SET search_path TO 'public'
AS '$libdir/vector', $function$vector_avg$function$;

CREATE OR REPLACE FUNCTION public.halfvec_avg(double precision[])
 RETURNS halfvec
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
 SECURITY DEFINER
 SET search_path TO 'public'
AS '$libdir/vector', $function$halfvec_avg$function$;

-- 2. Add proper indexes for new AI coaching tables for performance
CREATE INDEX IF NOT EXISTS idx_ai_coaching_sessions_user_id ON ai_coaching_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_coaching_sessions_session_type ON ai_coaching_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_ai_coaching_sessions_start_time ON ai_coaching_sessions(start_time);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id ON ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_session_id ON ai_recommendations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_status ON ai_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_priority ON ai_recommendations(priority);

CREATE INDEX IF NOT EXISTS idx_ai_coaching_plans_user_id ON ai_coaching_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_coaching_plans_status ON ai_coaching_plans(status);

CREATE INDEX IF NOT EXISTS idx_user_coaching_preferences_user_id ON user_coaching_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_coaching_analytics_user_id ON ai_coaching_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_coaching_analytics_metric_type ON ai_coaching_analytics(metric_type);

-- 3. Add proper updated_at triggers for new tables
CREATE TRIGGER update_ai_coaching_sessions_updated_at
    BEFORE UPDATE ON ai_coaching_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_recommendations_updated_at
    BEFORE UPDATE ON ai_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_coaching_plans_updated_at
    BEFORE UPDATE ON ai_coaching_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_coaching_preferences_updated_at
    BEFORE UPDATE ON user_coaching_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();