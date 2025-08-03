/**
 * 🎯 PRD ADMIN DASHBOARD
 * 
 * SCRUM Team Excellence - Komplett PRD Management Interface
 * Endast tillgänglig för superadmin och admin roller
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  GitBranch, 
  Database, 
  Cpu, 
  Shield, 
  RefreshCw,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { PRDArchitectureView, AssessmentStructureView, PillarSystemView } from './PRDVisualization';

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
  is_current: boolean;
}

interface PRDComponent {
  id: string;
  component_type: string;
  component_name: string;
  file_path: string;
  description: string;
  complexity_score: number;
  functionality: any;
}

interface PRDFeature {
  id: string;
  feature_category: string;
  feature_name: string;
  feature_description: string;
  implementation_status: string;
  user_roles: any; // JSON array från database
  technical_complexity: number;
  business_value: string;
}

export const PRDAdminDashboard = () => {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [currentPRD, setCurrentPRD] = useState<PRDDocument | null>(null);
  const [prdHistory, setPRDHistory] = useState<PRDDocument[]>([]);
  const [components, setComponents] = useState<PRDComponent[]>([]);
  const [features, setFeatures] = useState<PRDFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Security check - endast superadmin och admin
  if (!hasRole('superadmin') && !hasRole('admin')) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Åtkomst nekad. Endast superadmin och admin har tillgång till PRD-systemet.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  useEffect(() => {
    loadPRDData();
  }, []);

  const loadPRDData = async () => {
    setLoading(true);
    try {
      // Ladda aktuellt PRD dokument
      const { data: currentDoc, error: currentError } = await supabase
        .from('prd_documents')
        .select('*')
        .eq('is_current', true)
        .single();

      if (currentError && currentError.code !== 'PGRST116') {
        console.error('Error loading current PRD:', currentError);
      } else if (currentDoc) {
        setCurrentPRD(currentDoc);

        // Ladda komponenter för aktuellt dokument
        const { data: componentsData } = await supabase
          .from('prd_components')
          .select('*')
          .eq('prd_document_id', currentDoc.id);

        setComponents(componentsData || []);

        // Ladda features för aktuellt dokument
        const { data: featuresData } = await supabase
          .from('prd_features')
          .select('*')
          .eq('prd_document_id', currentDoc.id);

        setFeatures((featuresData || []) as PRDFeature[]);
      }

      // Ladda PRD historik (begränsad data)
      const { data: historyData } = await supabase
        .from('prd_documents')
        .select('id, version, generated_at, is_current, title, description')
        .order('generated_at', { ascending: false })
        .limit(10);

      setPRDHistory((historyData || []) as PRDDocument[]);

    } catch (error) {
      console.error('Error loading PRD data:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda PRD-data",
        variant: "destructive",
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
        description: `Nytt PRD ${data.version} har skapats med ${data.summary.totalComponents} komponenter`,
      });

      // Reload data
      await loadPRDData();

    } catch (error) {
      console.error('Error generating PRD:', error);
      toast({
        title: "Fel",
        description: "Kunde inte generera nytt PRD",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const exportPRD = async () => {
    if (!currentPRD) return;

    try {
      // Skapa en JSON export av hela PRD
      const exportData = {
        document: currentPRD,
        components,
        features,
        exportedAt: new Date().toISOString()
      };

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
        title: "Export Slutförd",
        description: "PRD har exporterats som JSON-fil",
      });

    } catch (error) {
      console.error('Error exporting PRD:', error);
      toast({
        title: "Export Misslyckades",
        description: "Kunde inte exportera PRD",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Laddar PRD-data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Requirements Document</h1>
          <p className="text-muted-foreground">
            Automatiskt genererad systemdokumentation
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
            className="bg-primary"
          >
            {generating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {generating ? 'Genererar...' : 'Generera Nytt PRD'}
          </Button>
        </div>
      </div>

      {/* Current PRD Overview */}
      {currentPRD && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {currentPRD.title}
              </CardTitle>
              <Badge variant="default">
                Version {currentPRD.version}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Genererat: {new Date(currentPRD.generated_at).toLocaleString('sv-SE')}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {currentPRD.component_inventory?.components?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Komponenter</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {currentPRD.feature_matrix?.features?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Funktioner</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {currentPRD.api_documentation?.totalEndpoints || 0}
                </div>
                <div className="text-sm text-muted-foreground">API Endpoints</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {currentPRD.database_schema?.totalTables || 0}
                </div>
                <div className="text-sm text-muted-foreground">Databastabeller</div>
              </div>
            </div>
            
            <p className="text-sm leading-relaxed">
              {currentPRD.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Detailed Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="architecture">Arkitektur</TabsTrigger>
          <TabsTrigger value="components">Komponenter</TabsTrigger>
          <TabsTrigger value="features">Funktioner</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="pillars">Pillars</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {currentPRD && (
            <>
              {/* System Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    Systemöversikt
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Teknisk Stack</h4>
                      <div className="space-y-2 text-sm">
                        <div>Frontend: {currentPRD.system_overview?.technicalStack?.frontend}</div>
                        <div>Backend: {currentPRD.system_overview?.technicalStack?.backend}</div>
                        <div>AI: {currentPRD.system_overview?.technicalStack?.ai}</div>
                        <div>Visualisering: {currentPRD.system_overview?.technicalStack?.visualization}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Nyckelkapaciteter</h4>
                      <div className="space-y-1">
                        {currentPRD.system_overview?.keyCapabilities?.map((capability: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            {capability}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance & Security */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Prestanda
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Laddningstid:</span>
                      <span className="text-sm font-medium">{currentPRD.performance_metrics?.averageLoadTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Assessment completion:</span>
                      <span className="text-sm font-medium">{currentPRD.performance_metrics?.assessmentCompletionRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">System uptime:</span>
                      <span className="text-sm font-medium">{currentPRD.performance_metrics?.systemUptime}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Säkerhet
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Autentisering:</span>
                      <span className="text-sm font-medium">{currentPRD.security_audit?.authenticationMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Kryptering:</span>
                      <span className="text-sm font-medium">{currentPRD.security_audit?.dataEncryption}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Compliance:</span>
                      <span className="text-sm font-medium">{currentPRD.security_audit?.complianceLevel}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="architecture" className="space-y-6">
          {currentPRD && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Systemarkitektur
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Här kommer React Flow visualiseringen */}
                <div className="bg-gray-50 border rounded-lg p-4">
                  <p className="text-center text-muted-foreground">
                    Arkitekturdiagram laddas dynamiskt från PRD-data...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="components" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Systemkomponenter ({components.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {components.map((component) => (
                  <div key={component.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{component.component_name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{component.component_type}</Badge>
                        <Badge variant="secondary">
                          Komplexitet: {component.complexity_score}/10
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {component.description}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      📁 {component.file_path}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Systemfunktioner ({features.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {features.map((feature) => (
                  <div key={feature.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{feature.feature_name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={feature.implementation_status === 'implemented' ? 'default' : 'secondary'}
                        >
                          {feature.implementation_status}
                        </Badge>
                        <Badge variant="outline">
                          {feature.feature_category}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {feature.feature_description}
                    </p>
                    <div className="text-sm mb-2">
                      <strong>Affärsvärde:</strong> {feature.business_value}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Roller: {Array.isArray(feature.user_roles) ? feature.user_roles.join(', ') : 'N/A'}</span>
                      <span>Komplexitet: {feature.technical_complexity}/10</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-6">
          {currentPRD && (
            <Card>
              <CardHeader>
                <CardTitle>Assessment System Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <AssessmentStructureView 
                  assessmentData={currentPRD.assessment_structure} 
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pillars" className="space-y-6">
          {currentPRD && (
            <Card>
              <CardHeader>
                <CardTitle>Six Pillars System</CardTitle>
              </CardHeader>
              <CardContent>
                <PillarSystemView 
                  pillarData={currentPRD.pillar_system_data} 
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* PRD History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            PRD Historik
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {prdHistory.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <span className="font-medium">Version {doc.version}</span>
                  {doc.is_current && (
                    <Badge className="ml-2" variant="default">Aktuell</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(doc.generated_at).toLocaleString('sv-SE')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};