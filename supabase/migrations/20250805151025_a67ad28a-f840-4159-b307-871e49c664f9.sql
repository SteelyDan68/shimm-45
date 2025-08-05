-- =====================================================
-- DATA EXPORT/IMPORT SYSTEM TABLES
-- =====================================================

-- Export Templates Table
CREATE TABLE public.export_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  data_types TEXT[] NOT NULL DEFAULT '{}',
  format TEXT NOT NULL CHECK (format IN ('csv', 'excel', 'json')),
  include_metadata BOOLEAN NOT NULL DEFAULT true,
  filters JSONB DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Export Requests Table  
CREATE TABLE public.export_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  format TEXT NOT NULL,
  data_types TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_url TEXT,
  file_size_bytes BIGINT,
  error_message TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Import Requests Table
CREATE TABLE public.import_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  total_rows INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  error_details JSONB DEFAULT '{}',
  error_message TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- ANALYTICS SYSTEM TABLES
-- =====================================================

-- Analytics Metrics Table
CREATE TABLE public.analytics_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Assessment Templates Table  
CREATE TABLE public.assessment_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  pillar_key TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',
  scoring_config JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- System Performance Metrics
CREATE TABLE public.system_performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.export_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_performance_metrics ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Export Templates Policies
CREATE POLICY "Users can manage their own export templates" 
ON public.export_templates 
FOR ALL 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can view all export templates"
ON public.export_templates
FOR SELECT
USING (is_admin(auth.uid()));

-- Export Requests Policies
CREATE POLICY "Users can manage their own export requests"
ON public.export_requests
FOR ALL
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can view all export requests"
ON public.export_requests
FOR SELECT
USING (is_admin(auth.uid()));

-- Import Requests Policies  
CREATE POLICY "Users can manage their own import requests"
ON public.import_requests
FOR ALL
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can view all import requests"
ON public.import_requests
FOR SELECT
USING (is_admin(auth.uid()));

-- Analytics Metrics Policies
CREATE POLICY "Users can view their own analytics"
ON public.analytics_metrics
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert analytics metrics"
ON public.analytics_metrics
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all analytics"
ON public.analytics_metrics
FOR SELECT
USING (is_admin(auth.uid()));

-- Assessment Templates Policies
CREATE POLICY "Authenticated users can view active templates"
ON public.assessment_templates
FOR SELECT
USING (is_active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage assessment templates"
ON public.assessment_templates
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- System Performance Metrics Policies
CREATE POLICY "Admins can view system metrics"
ON public.system_performance_metrics
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "System can insert performance metrics"
ON public.system_performance_metrics
FOR INSERT
WITH CHECK (true);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_export_templates_created_by ON public.export_templates(created_by);
CREATE INDEX idx_export_requests_created_by ON public.export_requests(created_by);
CREATE INDEX idx_export_requests_status ON public.export_requests(status);
CREATE INDEX idx_import_requests_created_by ON public.import_requests(created_by);
CREATE INDEX idx_import_requests_status ON public.import_requests(status);
CREATE INDEX idx_analytics_metrics_user_id ON public.analytics_metrics(user_id);
CREATE INDEX idx_analytics_metrics_type ON public.analytics_metrics(metric_type);
CREATE INDEX idx_analytics_metrics_recorded_at ON public.analytics_metrics(recorded_at);
CREATE INDEX idx_assessment_templates_pillar_key ON public.assessment_templates(pillar_key);
CREATE INDEX idx_assessment_templates_active ON public.assessment_templates(is_active);
CREATE INDEX idx_system_performance_type ON public.system_performance_metrics(metric_type);
CREATE INDEX idx_system_performance_recorded_at ON public.system_performance_metrics(recorded_at);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_export_templates_updated_at
  BEFORE UPDATE ON public.export_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessment_templates_updated_at
  BEFORE UPDATE ON public.assessment_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();