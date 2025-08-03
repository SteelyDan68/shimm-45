-- DYNAMISKT PRODUCT REQUIREMENTS DOCUMENT SYSTEM
-- Endast tillgängligt för superadmin och admin roller

-- PRD huvudtabell för att lagra dokumentversioner
CREATE TABLE public.prd_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version VARCHAR(10) NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  generated_by UUID REFERENCES auth.users(id),
  title TEXT NOT NULL DEFAULT 'System Product Requirements Document',
  description TEXT,
  system_overview JSONB NOT NULL DEFAULT '{}',
  architecture_data JSONB NOT NULL DEFAULT '{}',
  component_inventory JSONB NOT NULL DEFAULT '{}',
  feature_matrix JSONB NOT NULL DEFAULT '{}',
  user_flow_data JSONB NOT NULL DEFAULT '{}',
  assessment_structure JSONB NOT NULL DEFAULT '{}',
  pillar_system_data JSONB NOT NULL DEFAULT '{}',
  api_documentation JSONB NOT NULL DEFAULT '{}',
  database_schema JSONB NOT NULL DEFAULT '{}',
  performance_metrics JSONB NOT NULL DEFAULT '{}',
  security_audit JSONB NOT NULL DEFAULT '{}',
  deployment_info JSONB NOT NULL DEFAULT '{}',
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- PRD komponenter för detaljerad spårning
CREATE TABLE public.prd_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prd_document_id UUID REFERENCES public.prd_documents(id) ON DELETE CASCADE,
  component_type TEXT NOT NULL, -- 'react_component', 'hook', 'page', 'api_endpoint', 'database_table'
  component_name TEXT NOT NULL,
  file_path TEXT,
  description TEXT,
  dependencies JSONB DEFAULT '[]',
  props_interface JSONB DEFAULT '{}',
  functionality JSONB DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  last_modified TIMESTAMP WITH TIME ZONE,
  complexity_score INTEGER DEFAULT 1, -- 1-10 scale
  maintenance_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- PRD system features för funktionsmatris
CREATE TABLE public.prd_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prd_document_id UUID REFERENCES public.prd_documents(id) ON DELETE CASCADE,
  feature_category TEXT NOT NULL, -- 'authentication', 'assessment', 'pillar_management', 'analytics', etc.
  feature_name TEXT NOT NULL,
  feature_description TEXT,
  implementation_status TEXT NOT NULL DEFAULT 'implemented', -- 'implemented', 'planned', 'deprecated'
  user_roles JSONB DEFAULT '[]', -- vilka roller som har tillgång
  related_components JSONB DEFAULT '[]',
  api_endpoints JSONB DEFAULT '[]',
  database_tables JSONB DEFAULT '[]',
  business_value TEXT,
  technical_complexity INTEGER DEFAULT 1, -- 1-10 scale
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- PRD system arkitektur för visualisering
CREATE TABLE public.prd_architecture_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prd_document_id UUID REFERENCES public.prd_documents(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL, -- for React Flow
  node_type TEXT NOT NULL, -- 'component', 'page', 'service', 'database', 'api'
  node_label TEXT NOT NULL,
  node_category TEXT, -- 'frontend', 'backend', 'database', 'external'
  position_x NUMERIC NOT NULL DEFAULT 0,
  position_y NUMERIC NOT NULL DEFAULT 0,
  node_data JSONB DEFAULT '{}',
  style_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- PRD system arkitektur edges för kopplingar
CREATE TABLE public.prd_architecture_edges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prd_document_id UUID REFERENCES public.prd_documents(id) ON DELETE CASCADE,
  edge_id TEXT NOT NULL, -- for React Flow
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  edge_type TEXT DEFAULT 'default', -- 'data_flow', 'dependency', 'api_call', 'user_navigation'
  edge_label TEXT,
  edge_data JSONB DEFAULT '{}',
  style_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all PRD tables
ALTER TABLE public.prd_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prd_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prd_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prd_architecture_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prd_architecture_edges ENABLE ROW LEVEL SECURITY;

-- RLS Policies - ENDAST superadmin och admin
CREATE POLICY "Only superadmins and admins can manage PRD documents"
ON public.prd_documents
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('superadmin', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('superadmin', 'admin')
  )
);

CREATE POLICY "Only superadmins and admins can manage PRD components"
ON public.prd_components
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('superadmin', 'admin')
  )
);

CREATE POLICY "Only superadmins and admins can manage PRD features"
ON public.prd_features
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('superadmin', 'admin')
  )
);

CREATE POLICY "Only superadmins and admins can manage PRD architecture nodes"
ON public.prd_architecture_nodes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('superadmin', 'admin')
  )
);

CREATE POLICY "Only superadmins and admins can manage PRD architecture edges"
ON public.prd_architecture_edges
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('superadmin', 'admin')
  )
);

-- Triggers för updated_at
CREATE OR REPLACE FUNCTION public.update_prd_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prd_documents_updated_at
  BEFORE UPDATE ON public.prd_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_prd_updated_at();

-- Index för prestanda
CREATE INDEX idx_prd_documents_current ON public.prd_documents(is_current) WHERE is_current = true;
CREATE INDEX idx_prd_components_type ON public.prd_components(component_type);
CREATE INDEX idx_prd_features_category ON public.prd_features(feature_category);
CREATE INDEX idx_prd_features_status ON public.prd_features(implementation_status);
CREATE INDEX idx_prd_architecture_nodes_type ON public.prd_architecture_nodes(node_type);
CREATE INDEX idx_prd_architecture_edges_source ON public.prd_architecture_edges(source_node_id);
CREATE INDEX idx_prd_architecture_edges_target ON public.prd_architecture_edges(target_node_id);