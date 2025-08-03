/**
 * DYNAMISKT PRD DASHBOARD
 * 
 * 🎯 ENTERPRISE-GRADE PRODUCT REQUIREMENTS DOCUMENT
 * Endast tillgängligt för superadmin och admin roller
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  RefreshCw, 
  Download, 
  Share, 
  Eye,
  Code,
  Database,
  Cpu,
  Shield,
  TrendingUp,
  GitBranch,
  Users,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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

export const PRDDashboard = () => {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  
  const [currentPRD, setCurrentPRD] = useState<PRDDocument | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Kontrollera behörighet
  if (!hasRole('superadmin') && !hasRole('admin')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <div className="text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Åtkomst nekad</h3>
              <p className="text-muted-foreground">Endast superadmin och admin har tillgång till PRD-systemet.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    loadCurrentPRD();
  }, []);

  const loadCurrentPRD = async () => {
    setLoading(true);
    try {
      // Hämta aktuellt PRD dokument
      const { data: prdDoc, error: prdError } = await supabase
        .from('prd_documents')
        .select('*')
        .eq('is_current', true)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (prdError) throw prdError;

      if (prdDoc) {
        setCurrentPRD(prdDoc);

        // Hämta komponenter
        const { data: componentsData, error: compError } = await supabase
          .from('prd_components')
          .select('*')
          .eq('prd_document_id', prdDoc.id)
          .order('complexity_score', { ascending: false });

        if (compError) throw compError;
        setComponents(componentsData || []);

        // Hämta features
        const { data: featuresData, error: featError } = await supabase
          .from('prd_features')
          .select('*')
          .eq('prd_document_id', prdDoc.id)
          .order('technical_complexity', { ascending: false });

        if (featError) throw featError;
        setFeatures(featuresData || []);

        // Hämta arkitektur data
        const { data: nodesData, error: nodesError } = await supabase
          .from('prd_architecture_nodes')
          .select('*')
          .eq('prd_document_id', prdDoc.id);

        const { data: edgesData, error: edgesError } = await supabase
          .from('prd_architecture_edges')
          .select('*')
          .eq('prd_document_id', prdDoc.id);

        if (!nodesError && !edgesError) {
          // Konvertera till React Flow format
          const flowNodes: Node[] = (nodesData || []).map(node => ({
            id: node.node_id,
            type: node.node_type,
            position: { x: Number(node.position_x), y: Number(node.position_y) },
            data: { 
              label: node.node_label,
              category: node.node_category,
              ...node.node_data 
            },
            style: getNodeStyle(node.node_category)
          }));

          const flowEdges: Edge[] = (edgesData || []).map(edge => ({
            id: edge.edge_id,
            source: edge.source_node_id,
            target: edge.target_node_id,
            type: edge.edge_type,
            label: edge.edge_label,
            style: getEdgeStyle(edge.edge_type)
          }));

          setNodes(flowNodes);
          setEdges(flowEdges);
        }
      }
    } catch (error: any) {
      console.error('Error loading PRD:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda PRD data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNewPRD = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-prd-document');
      
      if (error) throw error;

      toast({
        title: "PRD Genererat!",
        description: `Ny PRD version ${data.version} har skapats`,
      });

      // Ladda om data
      await loadCurrentPRD();
    } catch (error: any) {
      console.error('Error generating PRD:', error);
      toast({
        title: "Fel",
        description: "Kunde inte generera nytt PRD",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const exportPRD = async () => {
    if (!currentPRD) return;

    try {
      // Skapa exportdata
      const exportData = {
        metadata: {
          title: currentPRD.title,
          version: currentPRD.version,
          generated_at: currentPRD.generated_at,
          export_date: new Date().toISOString()
        },
        systemOverview: currentPRD.system_overview,
        components: components,
        features: features,
        architecture: {
          nodes: nodes,
          edges: edges
        },
        assessmentStructure: currentPRD.assessment_structure,
        pillarSystem: currentPRD.pillar_system_data,
        apiDocumentation: currentPRD.api_documentation,
        databaseSchema: currentPRD.database_schema,
        securityAudit: currentPRD.security_audit,
        performanceMetrics: currentPRD.performance_metrics
      };

      // Skapa och ladda ner JSON fil
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PRD-${currentPRD.version}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export slutförd",
        description: "PRD har exporterats som JSON fil"
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export misslyckades",
        description: "Kunde inte exportera PRD",
        variant: "destructive"
      });
    }
  };

  const getNodeStyle = (category: string) => {
    const styles = {
      frontend: { backgroundColor: '#e1f5fe', border: '2px solid #0277bd' },
      backend: { backgroundColor: '#f3e5f5', border: '2px solid #7b1fa2' },
      database: { backgroundColor: '#e8f5e8', border: '2px solid #388e3c' },
      external: { backgroundColor: '#fff3e0', border: '2px solid #f57c00' }
    };
    return styles[category as keyof typeof styles] || {};
  };

  const getEdgeStyle = (type: string) => {
    const styles = {
      data_flow: { stroke: '#4caf50', strokeWidth: 2 },
      dependency: { stroke: '#2196f3', strokeWidth: 2 },
      api_call: { stroke: '#ff9800', strokeWidth: 2 },
      user_navigation: { stroke: '#9c27b0', strokeWidth: 2 }
    };
    return styles[type as keyof typeof styles] || {};
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Laddar PRD data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Product Requirements Document
          </h1>
          <p className="text-muted-foreground mt-2">
            Dynamisk systemdokumentation med automatisk uppdatering
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={exportPRD}
            disabled={!currentPRD}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportera
          </Button>
          
          <Button
            onClick={generateNewPRD}
            disabled={generating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Genererar...' : 'Generera Nytt PRD'}
          </Button>
        </div>
      </div>

      {currentPRD && (
        <>
          {/* Status Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{currentPRD.version}</div>
                  <p className="text-sm text-muted-foreground">Aktuell Version</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{components.length}</div>
                  <p className="text-sm text-muted-foreground">Komponenter</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{features.length}</div>
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

          {/* Huvudinnehåll */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Översikt</TabsTrigger>
              <TabsTrigger value="architecture">Arkitektur</TabsTrigger>
              <TabsTrigger value="components">Komponenter</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="assessment">Assessment</TabsTrigger>
              <TabsTrigger value="security">Säkerhet</TabsTrigger>
            </TabsList>

            {/* System Översikt */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    System Översikt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-semibold mb-2">Applikationsnamn</h4>
                      <p className="text-sm text-muted-foreground">
                        {currentPRD.system_overview?.applicationName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Beskrivning</h4>
                      <p className="text-sm text-muted-foreground">
                        {currentPRD.system_overview?.description || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {currentPRD.system_overview?.technicalStack && (
                    <div>
                      <h4 className="font-semibold mb-2">Teknisk Stack</h4>
                      <div className="grid gap-2 md:grid-cols-2">
                        {Object.entries(currentPRD.system_overview.technicalStack).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize text-sm">{key}:</span>
                            <Badge variant="outline" className="text-xs">
                              {value as string}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Arkitektur Visualisering */}
            <TabsContent value="architecture" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    System Arkitektur
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96 border rounded-lg">
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      fitView
                      attributionPosition="top-right"
                      style={{ backgroundColor: "#F7F9FB" }}
                    >
                      <Background />
                      <Controls />
                      <MiniMap zoomable pannable />
                    </ReactFlow>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Komponenter */}
            <TabsContent value="components" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Komponent Inventarie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {components.map((component) => (
                      <div key={component.id} className="border rounded-lg p-4">
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
                        <p className="text-sm mb-2">{component.description}</p>
                        {component.dependencies.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Dependencies: {component.dependencies.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Features */}
            <TabsContent value="features" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Feature Matrix
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {features.map((feature) => (
                      <div key={feature.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{feature.feature_name}</h4>
                            <p className="text-sm text-muted-foreground capitalize">
                              {feature.feature_category}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge 
                              variant={feature.implementation_status === 'implemented' ? 'default' : 'secondary'}
                            >
                              {feature.implementation_status}
                            </Badge>
                            <Badge variant="outline">
                              Komplexitet: {feature.technical_complexity}/10
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm mb-2">{feature.feature_description}</p>
                        <div className="text-xs text-muted-foreground">
                          <strong>Business Value:</strong> {feature.business_value}
                        </div>
                        {feature.user_roles.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            <strong>Roller:</strong> {feature.user_roles.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assessment System */}
            <TabsContent value="assessment" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Assessment & Pillar System
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentPRD.assessment_structure && (
                    <div>
                      <h4 className="font-semibold mb-2">Assessment Typer</h4>
                      <div className="grid gap-2 md:grid-cols-3">
                        {currentPRD.assessment_structure.assessmentTypes?.map((type: string) => (
                          <Badge key={type} variant="outline" className="justify-center">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentPRD.pillar_system_data && (
                    <div>
                      <h4 className="font-semibold mb-2">Six Pillars</h4>
                      <div className="grid gap-2 md:grid-cols-3">
                        {currentPRD.pillar_system_data.pillars?.map((pillar: string) => (
                          <Badge key={pillar} variant="secondary" className="justify-center">
                            {pillar}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Säkerhet & Performance */}
            <TabsContent value="security" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Säkerhetsaudit
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentPRD.security_audit && Object.entries(currentPRD.security_audit).map(([key, value]) => (
                      <div key={key} className="mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium capitalize">{key}</span>
                        </div>
                        <p className="text-xs text-muted-foreground ml-6">{value as string}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentPRD.performance_metrics && Object.entries(currentPRD.performance_metrics).map(([key, value]) => (
                      <div key={key} className="mb-3">
                        <h5 className="text-sm font-medium capitalize mb-1">{key}</h5>
                        {typeof value === 'object' && value !== null ? (
                          Object.entries(value as Record<string, any>).map(([subKey, subValue]) => (
                            <div key={subKey} className="text-xs text-muted-foreground ml-2">
                              <span className="capitalize">{subKey}:</span> {subValue as string}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">{value as string}</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Metadata Footer */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Genererat: {new Date(currentPRD.generated_at).toLocaleString('sv-SE')}
                  </span>
                  <span>Version: {currentPRD.version}</span>
                </div>
                <Badge variant="outline">Uppdateras dagligen kl 06:00</Badge>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};