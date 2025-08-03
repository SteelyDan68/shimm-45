/**
 * 🚀 SIMPLIFIED PRD GENERATOR
 * 
 * Skapar PRD dokumentation för systemet
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🚀 Starting simplified PRD generation...');

    // Generate version (max 10 chars)
    const now = new Date();
    const version = `v${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    
    // Mark previous versions as non-current
    await supabase
      .from('prd_documents')
      .update({ is_current: false })
      .eq('is_current', true);

    // Create system overview
    const systemOverview = {
      applicationName: 'Systemkritisk Platform',
      description: 'Enterprise-grade coaching and assessment platform',
      version: version,
      generatedAt: now.toISOString(),
      technicalStack: {
        frontend: 'React + TypeScript + Tailwind',
        backend: 'Supabase + Edge Functions',
        database: 'PostgreSQL + RLS',
        deployment: 'Edge Runtime'
      }
    };

    // Create new PRD document
    const { data: prdDocument, error: prdError } = await supabase
      .from('prd_documents')
      .insert({
        version,
        title: 'Systemkritisk - Product Requirements Document',
        description: 'Automatiskt genererat PRD med systemdokumentation',
        system_overview: systemOverview,
        architecture_data: { version: version, timestamp: now.toISOString() },
        component_inventory: { message: 'Component analysis in development' },
        feature_matrix: { message: 'Feature analysis in development' },
        assessment_structure: { message: 'Assessment analysis in development' },
        pillar_system_data: { message: 'Pillar analysis in development' },
        api_documentation: { message: 'API documentation in development' },
        database_schema: { message: 'Schema analysis in development' },
        performance_metrics: { message: 'Performance metrics in development' },
        security_audit: { message: 'Security audit in development' },
        deployment_info: { environment: 'Supabase Edge Functions', version: version },
        is_current: true
      })
      .select()
      .single();

    if (prdError) {
      console.error('❌ PRD document creation error:', prdError);
      throw prdError;
    }

    // Add sample components
    const sampleComponents = [
      {
        prd_document_id: prdDocument.id,
        component_type: 'react_component',
        component_name: 'PRDDashboard',
        file_path: 'src/components/Admin/PRDDashboard.tsx',
        description: 'Enterprise PRD management dashboard',
        dependencies: ['React', 'useAuth', 'Supabase'],
        props_interface: {},
        functionality: { admin: true, visualization: true },
        complexity_score: 8
      },
      {
        prd_document_id: prdDocument.id,
        component_type: 'page',
        component_name: 'Administration',
        file_path: 'src/pages/Administration.tsx',
        description: 'Main administration interface',
        dependencies: ['PRDDashboard', 'UserManagement'],
        props_interface: {},
        functionality: { admin: true, management: true },
        complexity_score: 9
      }
    ];

    // Add sample features
    const sampleFeatures = [
      {
        prd_document_id: prdDocument.id,
        feature_category: 'Administration',
        feature_name: 'PRD Management System',
        feature_description: 'Automated generation and management of Product Requirements Documents',
        implementation_status: 'implemented',
        user_roles: ['superadmin', 'admin'],
        related_components: ['PRDDashboard', 'Administration'],
        api_endpoints: ['generate-prd-document'],
        database_tables: ['prd_documents', 'prd_components', 'prd_features'],
        business_value: 'high',
        technical_complexity: 8
      },
      {
        prd_document_id: prdDocument.id,
        feature_category: 'Security',
        feature_name: 'Role-Based Access Control',
        feature_description: 'Comprehensive user role and permission management',
        implementation_status: 'implemented',
        user_roles: ['superadmin', 'admin', 'coach', 'user'],
        related_components: ['useAuth', 'UserRoles'],
        api_endpoints: ['auth'],
        database_tables: ['user_roles', 'profiles'],
        business_value: 'critical',
        technical_complexity: 9
      }
    ];

    // Add sample architecture nodes
    const sampleNodes = [
      {
        prd_document_id: prdDocument.id,
        node_id: 'frontend-app',
        node_type: 'component',
        node_label: 'React Frontend',
        node_category: 'frontend',
        position_x: 100,
        position_y: 100,
        node_data: { technology: 'React + TypeScript' },
        style_config: { backgroundColor: '#e1f5fe' }
      },
      {
        prd_document_id: prdDocument.id,
        node_id: 'supabase-backend',
        node_type: 'service',
        node_label: 'Supabase Backend',
        node_category: 'backend',
        position_x: 300,
        position_y: 100,
        node_data: { technology: 'PostgreSQL + Edge Functions' },
        style_config: { backgroundColor: '#f3e5f5' }
      }
    ];

    // Add sample architecture edges
    const sampleEdges = [
      {
        prd_document_id: prdDocument.id,
        edge_id: 'frontend-backend',
        source_node_id: 'frontend-app',
        target_node_id: 'supabase-backend',
        edge_type: 'api_call',
        edge_label: 'API Calls',
        edge_data: { protocol: 'HTTPS' },
        style_config: { stroke: '#4caf50' }
      }
    ];

    // Insert all data
    const insertPromises = [
      supabase.from('prd_components').insert(sampleComponents),
      supabase.from('prd_features').insert(sampleFeatures),
      supabase.from('prd_architecture_nodes').insert(sampleNodes),
      supabase.from('prd_architecture_edges').insert(sampleEdges)
    ];

    await Promise.all(insertPromises);

    console.log(`✅ PRD ${version} generated successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        version,
        prdDocumentId: prdDocument.id,
        message: 'PRD generated successfully',
        summary: {
          totalComponents: sampleComponents.length,
          totalFeatures: sampleFeatures.length,
          totalNodes: sampleNodes.length,
          totalEdges: sampleEdges.length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ PRD generation error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'PRD generation failed', 
        details: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});