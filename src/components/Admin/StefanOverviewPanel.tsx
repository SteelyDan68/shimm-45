import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Database, 
  Activity, 
  Settings, 
  BarChart3,
  MessageSquare,
  Zap,
  FileText,
  Users,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import StefanMemoryManager from './StefanMemoryManager';
import StefanTrainingData from '@/components/StefanTrainingData';
import { HelpTooltip } from '@/components/HelpTooltip';

export default function StefanOverviewPanel() {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Mock data för Stefan AI
  const stefanStats = {
    totalInteractions: 1247,
    weeklyInteractions: 89,
    memoryFragments: 156,
    trainingDocuments: 23,
    accuracy: 94.2,
    responseTimes: 1.3, // seconds
    activePersonas: 3,
    systemStatus: 'operational'
  };

  const personas = [
    { name: 'Mentor', active: true, interactions: 456 },
    { name: 'Analytiker', active: true, interactions: 321 },
    { name: 'Motivator', active: false, interactions: 234 }
  ];

  return (
    <div className="space-y-6">
      {/* Stefan AI Overview Header */}
      <Card className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-full shadow-sm">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  Stefan AI-hantering
                  <HelpTooltip content="Central kontroll över Stefan AI-systemet, träningsdata och minnesfunktioner" />
                </CardTitle>
                <p className="text-muted-foreground">
                  Övervaka och konfigurera AI-assistenten
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {stefanStats.accuracy}%
              </div>
              <p className="text-sm text-muted-foreground">AI-träffsäkerhet</p>
              <Badge variant="default" className="mt-1">
                Operativ
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stefan Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Totala interaktioner
              <HelpTooltip content="Antal samtal och dialoger med Stefan AI totalt" />
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stefanStats.totalInteractions}</div>
            <p className="text-xs text-muted-foreground">
              +{stefanStats.weeklyInteractions} denna vecka
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Minnesfragment
              <HelpTooltip content="Antal lagrade kunskapsfragment i Stefan AI:s minnesbank" />
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stefanStats.memoryFragments}</div>
            <p className="text-xs text-muted-foreground">
              Kunskapselement
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Svarstid
              <HelpTooltip content="Genomsnittlig svarstid för AI-genererade svar" />
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stefanStats.responseTimes}s</div>
            <p className="text-xs text-muted-foreground">
              Medel svarstid
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Träningsdokument
              <HelpTooltip content="Antal uppladdade dokument för AI-träning" />
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stefanStats.trainingDocuments}</div>
            <p className="text-xs text-muted-foreground">
              Träningsdata
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stefan AI Management Tabs */}
      <Tabs defaultValue="memory" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="memory">Minnesbank</TabsTrigger>
          <TabsTrigger value="training">Träningsdata</TabsTrigger>
          <TabsTrigger value="personas">Personligheter</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Memory Management */}
        <TabsContent value="memory" className="space-y-6">
          <StefanMemoryManager />
        </TabsContent>

        {/* Training Data Management */}
        <TabsContent value="training" className="space-y-6">
          <StefanTrainingData />
        </TabsContent>

        {/* Personas Management */}
        <TabsContent value="personas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Stefan AI-personligheter
                <HelpTooltip content="Hantera olika AI-personligheter och deras beteenden" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {personas.map((persona, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${persona.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <div>
                          <h4 className="font-medium">{persona.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {persona.interactions} interaktioner
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={persona.active ? 'default' : 'secondary'}>
                          {persona.active ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                        <Button variant="outline" size="sm">
                          Konfigurera
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Prestanda över tid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Träffsäkerhet</span>
                      <span className="font-medium">{stefanStats.accuracy}%</span>
                    </div>
                    <Progress value={stefanStats.accuracy} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Användartillfredsställelse</span>
                      <span className="font-medium">87%</span>
                    </div>
                    <Progress value={87} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Systemupptid</span>
                      <span className="font-medium">99.8%</span>
                    </div>
                    <Progress value={99.8} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-600" />
                  Systemstatus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API-status</span>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Databas-anslutning</span>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Embeddings-service</span>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Minnesfunktion</span>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}