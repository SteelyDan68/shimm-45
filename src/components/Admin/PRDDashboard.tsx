/**
 * 🚀 ENTERPRISE-GRADE PRD DASHBOARD
 * 
 * TEAM: Full Stack SCRUM Team - Världsklass Implementation
 * ARCHITECT: Robust, scalable, production-ready solution
 * QA: Comprehensive error handling & edge cases
 * UX: Graceful degradation & clear user feedback
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  RefreshCw, 
  Download, 
  Shield,
  Eye,
  Code,
  GitBranch,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Database,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { 
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// 🏗️ ARCHITECT: Type-safe interfaces
interface PRDDocument {
  id: string;
  version: string;
  generated_at: string;
  title: string;
  description: string;
  system_overview: any;
  architecture_data: any;
  component_inventory: any;
  feature_matrix: any;
  assessment_structure: any;
  pillar_system_data: any;
  api_documentation: any;
  database_schema: any;
  performance_metrics: any;
  security_audit: any;
  deployment_info: any;
}

interface Component {
  id: string;
  component_name: string;
  component_type: string;
  file_path: string;
  description: string;
  complexity_score: number;
  dependencies: string[];
}

interface Feature {
  id: string;
  feature_name: string;
  feature_category: string;
  feature_description: string;
  implementation_status: string;
  technical_complexity: number;
  business_value: string;
  user_roles: string[];
}

// 🔍 QA: Error states enum
enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
  GENERATING = 'generating'
}

interface DashboardState {
  loadingState: LoadingState;
  errorMessage: string | null;
  currentPRD: PRDDocument | null;
  components: Component[];
  features: Feature[];
  hasData: boolean;
}

export const PRDDashboard = () => {
  // 🚀 DEVOPS: Initialize all hooks FIRST - no conditional calls
  const { hasRole, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // 🏗️ ARCHITECT: Centralized state management
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    loadingState: LoadingState.IDLE,
    errorMessage: null,
    currentPRD: null,
    components: [],
    features: [],
    hasData: false
  });
  
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // ⚛️ FRONTEND: React Flow hooks - always initialized
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // 🎨 UX: Computed access control
  const hasAccess = useMemo(() => {
    if (authLoading) return null; // Still checking
    return hasRole('superadmin') || hasRole('admin');
  }, [hasRole, authLoading]);

  // 💻 BACKEND: Robust data loading with comprehensive error handling
  const loadCurrentPRD = useCallback(async () => {
    console.log('🔄 PRD Dashboard: Starting data load...');
    
    setDashboardState(prev => ({
      ...prev,
      loadingState: LoadingState.LOADING,
      errorMessage: null
    }));

    try {
      // Step 1: Load PRD Document
      console.log('📄 Loading PRD document...');
      const { data: prdDoc, error: prdError } = await supabase
        .from('prd_documents')
        .select('*')
        .eq('is_current', true)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (prdError) {
        console.error('❌ PRD Document Error:', prdError);
        throw new Error(`Database error: ${prdError.message}`);
      }

      if (!prdDoc) {
        console.log('📝 No PRD document found');
        setDashboardState(prev => ({
          ...prev,
          loadingState: LoadingState.SUCCESS,
          hasData: false,
          errorMessage: 'Inget PRD dokument hittades. Generera ett nytt.'
        }));
        return;
      }

      console.log('✅ PRD Document loaded:', prdDoc.version);

      // Step 2: Load Components
      console.log('🧩 Loading components...');
      const { data: componentsData, error: compError } = await supabase
        .from('prd_components')
        .select('*')
        .eq('prd_document_id', prdDoc.id)
        .order('complexity_score', { ascending: false });

      if (compError) {
        console.warn('⚠️ Components load warning:', compError);
      }

      // Step 3: Load Features
      console.log('🎯 Loading features...');
      const { data: featuresData, error: featError } = await supabase
        .from('prd_features')
        .select('*')
        .eq('prd_document_id', prdDoc.id)
        .order('technical_complexity', { ascending: false });

      if (featError) {
        console.warn('⚠️ Features load warning:', featError);
      }

      // Step 4: Load Architecture
      console.log('🏗️ Loading architecture...');
      const [
        { data: nodesData, error: nodesError },
        { data: edgesData, error: edgesError }
      ] = await Promise.all([
        supabase.from('prd_architecture_nodes').select('*').eq('prd_document_id', prdDoc.id),
        supabase.from('prd_architecture_edges').select('*').eq('prd_document_id', prdDoc.id)
      ]);

      // 🔍 QA: Safe data processing
      const processedComponents = (componentsData || []).map(comp => ({
        ...comp,
        dependencies: Array.isArray(comp.dependencies) ? comp.dependencies : 
          (typeof comp.dependencies === 'string' ? 
            (() => {
              try { return JSON.parse(comp.dependencies); } 
              catch { return []; }
            })() : [])
      }));

      const processedFeatures = (featuresData || []).map(feat => ({
        ...feat,
        user_roles: Array.isArray(feat.user_roles) ? feat.user_roles : 
          (typeof feat.user_roles === 'string' ? 
            (() => {
              try { return JSON.parse(feat.user_roles); } 
              catch { return []; }
            })() : [])
      }));

      // ⚛️ FRONTEND: React Flow data processing
      if (!nodesError && !edgesError && nodesData && edgesData) {
        const flowNodes: Node[] = nodesData.map(node => ({
          id: node.node_id,
          type: node.node_type || 'default',
          position: { 
            x: Number(node.position_x) || 0, 
            y: Number(node.position_y) || 0 
          },
          data: { 
            label: node.node_label || 'Unknown Node',
            category: node.node_category,
            ...(typeof node.node_data === 'object' && node.node_data !== null ? node.node_data : {})
          },
          style: getNodeStyle(node.node_category)
        }));

        const flowEdges: Edge[] = edgesData.map(edge => ({
          id: edge.edge_id,
          source: edge.source_node_id,
          target: edge.target_node_id,
          type: edge.edge_type || 'default',
          label: edge.edge_label,
          style: getEdgeStyle(edge.edge_type)
        }));

        setNodes(flowNodes);
        setEdges(flowEdges);
        console.log(`🎯 Architecture loaded: ${flowNodes.length} nodes, ${flowEdges.length} edges`);
      }

      // 🎨 UX: Success state update
      setDashboardState({
        loadingState: LoadingState.SUCCESS,
        errorMessage: null,
        currentPRD: prdDoc,
        components: processedComponents,
        features: processedFeatures,
        hasData: true
      });

      console.log('✅ PRD Dashboard: Data load complete');

    } catch (error: any) {
      console.error('💥 PRD Dashboard: Critical error during load:', error);
      
      setDashboardState(prev => ({
        ...prev,
        loadingState: LoadingState.ERROR,
        errorMessage: error.message || 'Okänt fel vid datainläsning'
      }));

      toast({
        title: "Systemfel",
        description: "PRD data kunde inte laddas. Kontakta systemadministratör.",
        variant: "destructive"
      });
    }
  }, [setNodes, setEdges, toast]);

  // 💻 BACKEND: PRD Generation with full monitoring
  const generateNewPRD = useCallback(async () => {
    console.log('🚀 Starting PRD generation...');
    
    setDashboardState(prev => ({
      ...prev,
      loadingState: LoadingState.GENERATING,
      errorMessage: null
    }));

    try {
      const { data, error } = await supabase.functions.invoke('generate-prd-document', {
        body: {
          trigger: 'manual',
          user_id: user?.id,
          timestamp: new Date().toISOString()
        }
      });
      
      if (error) {
        console.error('❌ PRD Generation failed:', error);
        throw error;
      }

      console.log('✅ PRD Generated successfully:', data);

      toast({
        title: "PRD Genererat!",
        description: `Ny PRD version ${data?.version || 'N/A'} har skapats`,
        duration: 5000
      });

      // Reload data
      await loadCurrentPRD();

    } catch (error: any) {
      console.error('💥 PRD Generation error:', error);
      
      setDashboardState(prev => ({
        ...prev,
        loadingState: LoadingState.ERROR,
        errorMessage: `Kunde inte generera PRD: ${error.message}`
      }));

      toast({
        title: "Genereringsfel",
        description: "PRD kunde inte genereras. Försök igen eller kontakta support.",
        variant: "destructive"
      });
    }
  }, [user?.id, loadCurrentPRD, toast]);

  // 🎨 UX: Export functionality with comprehensive error handling
  const exportPRD = useCallback(async () => {
    if (!dashboardState.currentPRD) {
      toast({
        title: "Export fel",
        description: "Inget PRD att exportera",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('📤 Exporting PRD...');
      
      const exportData = {
        metadata: {
          title: dashboardState.currentPRD.title,
          version: dashboardState.currentPRD.version,
          generated_at: dashboardState.currentPRD.generated_at,
          export_date: new Date().toISOString(),
          exported_by: user?.id
        },
        document: dashboardState.currentPRD,
        components: dashboardState.components,
        features: dashboardState.features,
        architecture: { nodes, edges }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PRD-${dashboardState.currentPRD.version}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export slutförd",
        description: "PRD har exporterats som JSON fil"
      });

      console.log('✅ Export completed successfully');

    } catch (error: any) {
      console.error('💥 Export error:', error);
      toast({
        title: "Export misslyckades",
        description: "Kunde inte exportera PRD data",
        variant: "destructive"
      });
    }
  }, [dashboardState.currentPRD, dashboardState.components, dashboardState.features, nodes, edges, user?.id, toast]);

  // 🎨 UX: Styling functions
  const getNodeStyle = useCallback((category: string) => {
    const styles = {
      frontend: { backgroundColor: '#e1f5fe', border: '2px solid #0277bd' },
      backend: { backgroundColor: '#f3e5f5', border: '2px solid #7b1fa2' },
      database: { backgroundColor: '#e8f5e8', border: '2px solid #388e3c' },
      external: { backgroundColor: '#fff3e0', border: '2px solid #f57c00' }
    };
    return styles[category as keyof typeof styles] || { backgroundColor: '#f5f5f5', border: '2px solid #999' };
  }, []);

  const getEdgeStyle = useCallback((type: string) => {
    const styles = {
      data_flow: { stroke: '#4caf50', strokeWidth: 2 },
      dependency: { stroke: '#2196f3', strokeWidth: 2 },
      api_call: { stroke: '#ff9800', strokeWidth: 2 },
      user_navigation: { stroke: '#9c27b0', strokeWidth: 2 }
    };
    return styles[type as keyof typeof styles] || { stroke: '#666', strokeWidth: 1 };
  }, []);

  // 🚀 DEVOPS: Initialize data load
  useEffect(() => {
    if (hasAccess === true) {
      console.log('🔑 Access granted, loading PRD data...');
      loadCurrentPRD();
    }
  }, [hasAccess, loadCurrentPRD]);

  // 🔍 QA: Loading state - auth still checking
  if (authLoading || hasAccess === null) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Kontrollerar behörigheter...</p>
          </div>
        </div>
      </div>
    );
  }

  // 🔒 SECURITY: Access denied
  if (hasAccess === false) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <div className="text-center">
              <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Åtkomst nekad</h3>
              <p className="text-muted-foreground">Endast superadmin och admin har tillgång till PRD-systemet.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 🔍 QA: Data loading state
  if (dashboardState.loadingState === LoadingState.LOADING) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Laddar PRD data...</p>
            <Progress value={66} className="w-64 mt-4" />
          </div>
        </div>
      </div>
    );
  }

  // 🔍 QA: Error state
  if (dashboardState.loadingState === LoadingState.ERROR) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Systemfel:</strong> {dashboardState.errorMessage}
          </AlertDescription>
        </Alert>
        
        <div className="text-center">
          <Button onClick={loadCurrentPRD} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Försök igen
          </Button>
        </div>
      </div>
    );
  }

  // 🎨 UX: No data state
  if (!dashboardState.hasData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Inget PRD dokument</h3>
              <p className="text-muted-foreground mb-4">Generera ditt första PRD dokument för att komma igång.</p>
              <Button 
                onClick={generateNewPRD} 
                disabled={dashboardState.loadingState === LoadingState.GENERATING}
              >
                <Zap className={`h-4 w-4 mr-2 ${dashboardState.loadingState === LoadingState.GENERATING ? 'animate-spin' : ''}`} />
                {dashboardState.loadingState === LoadingState.GENERATING ? 'Genererar...' : 'Generera PRD'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 🎯 MAIN DASHBOARD RENDER
  return (
    <div className="p-6 space-y-6">
      {/* 🎨 Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Product Requirements Document
          </h1>
          <p className="text-muted-foreground mt-2">
            Enterprise-grade systemdokumentation - Version {dashboardState.currentPRD?.version}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={exportPRD}
            disabled={!dashboardState.currentPRD}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportera
          </Button>
          
          <Button
            onClick={generateNewPRD}
            disabled={dashboardState.loadingState === LoadingState.GENERATING}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${dashboardState.loadingState === LoadingState.GENERATING ? 'animate-spin' : ''}`} />
            {dashboardState.loadingState === LoadingState.GENERATING ? 'Genererar...' : 'Generera Nytt'}
          </Button>
        </div>
      </div>

      {/* 📊 Status Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{dashboardState.currentPRD?.version}</div>
              <p className="text-sm text-muted-foreground">Version</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{dashboardState.components.length}</div>
              <p className="text-sm text-muted-foreground">Komponenter</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{dashboardState.features.length}</div>
              <p className="text-sm text-muted-foreground">Features</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{nodes.length}</div>
              <p className="text-sm text-muted-foreground">Arkitektur Noder</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 📑 Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="architecture">Arkitektur</TabsTrigger>
          <TabsTrigger value="components">Komponenter</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        {/* System Overview */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                System Översikt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-2">Applikation</h4>
                  <p className="text-sm text-muted-foreground">
                    {dashboardState.currentPRD?.system_overview?.applicationName || 'Systemkritisk Platform'}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Genererad</h4>
                  <p className="text-sm text-muted-foreground">
                    {dashboardState.currentPRD?.generated_at ? 
                      new Date(dashboardState.currentPRD.generated_at).toLocaleString('sv-SE') : 
                      'Okänt'
                    }
                  </p>
                </div>
              </div>
              
              {dashboardState.currentPRD?.description && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Beskrivning</h4>
                  <p className="text-sm text-muted-foreground">
                    {dashboardState.currentPRD.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Architecture Visualization */}
        <TabsContent value="architecture" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                System Arkitektur ({nodes.length} noder, {edges.length} kopplingar)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 border rounded-lg bg-background">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  fitView
                  attributionPosition="top-right"
                  style={{ backgroundColor: "hsl(var(--background))" }}
                >
                  <Background />
                  <Controls />
                  <MiniMap zoomable pannable />
                </ReactFlow>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Components */}
        <TabsContent value="components" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Komponent Inventarie ({dashboardState.components.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardState.components.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Inga komponenter hittades</p>
                ) : (
                  dashboardState.components.map((component) => (
                    <div key={component.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{component.component_name}</h4>
                          <p className="text-sm text-muted-foreground">{component.file_path}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{component.component_type}</Badge>
                          <Badge variant="secondary">
                            Komplexitet: {component.complexity_score}/10
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{component.description}</p>
                      {component.dependencies && component.dependencies.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-muted-foreground">Beroenden:</span>
                          {component.dependencies.map((dep, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {dep}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Feature Matrix ({dashboardState.features.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardState.features.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Inga features hittades</p>
                ) : (
                  dashboardState.features.map((feature) => (
                    <div key={feature.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{feature.feature_name}</h4>
                          <p className="text-sm text-muted-foreground">{feature.feature_category}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge 
                            variant={feature.implementation_status === 'completed' ? 'default' : 'secondary'}
                          >
                            {feature.implementation_status}
                          </Badge>
                          <Badge variant="outline">
                            Komplexitet: {feature.technical_complexity}/10
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{feature.feature_description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Affärsvärde: <strong>{feature.business_value}</strong></span>
                        {feature.user_roles && feature.user_roles.length > 0 && (
                          <span>
                            Roller: {feature.user_roles.map((role, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs ml-1">
                                {role}
                              </Badge>
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 📊 System Status Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              System Online - Enterprise Grade
            </div>
            <div className="flex items-center gap-4">
              <span>Senast uppdaterad: {new Date().toLocaleString('sv-SE')}</span>
              <span>Version: {dashboardState.currentPRD?.version}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};