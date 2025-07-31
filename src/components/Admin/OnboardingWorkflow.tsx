import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  UserPlus, 
  ArrowRight,
  CheckCircle,
  Clock,
  Brain,
  Target,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AdminUserCreation } from '../AdminUserCreation';
import { OnboardingForm } from '../Onboarding/OnboardingForm';
import { ModularPillarAssessment } from '../FivePillars/ModularPillarAssessment';
import { HabitFormationCenter } from '../HabitFormation/HabitFormationCenter';

interface Client {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
  onboarding_completed: boolean;
  assessment_completed: boolean;
  habits_active: number;
}

interface OnboardingWorkflowProps {
  onClose?: () => void;
}

export const OnboardingWorkflow: React.FC<OnboardingWorkflowProps> = ({ onClose }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [currentStep, setCurrentStep] = useState<'create' | 'onboard' | 'assess' | 'habits' | 'complete'>('create');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check additional status for each client
      const clientsWithStatus = await Promise.all((data || []).map(async (client) => {
        // Check onboarding status
        const { data: onboardingData } = await supabase
          .from('path_entries')
          .select('id')
          .eq('client_id', client.id)
          .contains('metadata', { is_onboarding_complete: true })
          .single();

        // Check assessment status
        const { data: assessmentData } = await supabase
          .from('path_entries')
          .select('id')
          .eq('client_id', client.id)
          .contains('metadata', { is_assessment: true })
          .single();

        // Check active habits
        const { data: habitsData } = await supabase
          .from('path_entries')
          .select('id')
          .eq('client_id', client.id)
          .contains('metadata', { is_habit: true });

        return {
          ...client,
          onboarding_completed: !!onboardingData,
          assessment_completed: !!assessmentData,
          habits_active: habitsData?.length || 0
        };
      }));

      setClients(clientsWithStatus);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const getClientStatus = (client: Client): { status: string; nextStep: string; color: string } => {
    if (!client.onboarding_completed) {
      return { status: 'Behöver onboarding', nextStep: 'Genomför onboarding', color: 'bg-orange-500' };
    }
    if (!client.assessment_completed) {
      return { status: 'Behöver assessment', nextStep: 'Genomför Five Pillars', color: 'bg-blue-500' };
    }
    if (client.habits_active === 0) {
      return { status: 'Behöver vanor', nextStep: 'Skapa vanor', color: 'bg-purple-500' };
    }
    return { status: 'Komplett', nextStep: 'Klar', color: 'bg-green-500' };
  };

  const handleClientCreated = () => {
    loadClients();
    toast({
      title: "Klient skapad! 🎉",
      description: "Nu kan du påbörja onboarding-processen.",
    });
  };

  const startOnboarding = (client: Client) => {
    setSelectedClient(client);
    if (!client.onboarding_completed) {
      setCurrentStep('onboard');
    } else if (!client.assessment_completed) {
      setCurrentStep('assess');
    } else if (client.habits_active === 0) {
      setCurrentStep('habits');
    } else {
      setCurrentStep('complete');
    }
  };

  const handleStepComplete = (step: string) => {
    switch (step) {
      case 'onboard':
        setCurrentStep('assess');
        loadClients(); // Refresh to update status
        break;
      case 'assess':
        setCurrentStep('habits');
        loadClients();
        break;
      case 'habits':
        setCurrentStep('complete');
        loadClients();
        break;
    }
  };

  const getStepTitle = (): string => {
    switch (currentStep) {
      case 'create': return 'Skapa ny klient';
      case 'onboard': return 'Onboarding';
      case 'assess': return 'Five Pillars Assessment';
      case 'habits': return 'Vanformning';
      case 'complete': return 'Klar!';
      default: return '';
    }
  };

  const renderCurrentStep = () => {
    if (!selectedClient && currentStep !== 'create') return null;

    switch (currentStep) {
      case 'create':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Skapa ny klient
              </CardTitle>
              <CardDescription>
                Börja med att skapa en ny klient i systemet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminUserCreation onUserCreated={handleClientCreated} />
            </CardContent>
          </Card>
        );

      case 'onboard':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Onboarding för {selectedClient?.name}
              </CardTitle>
              <CardDescription>
                Samla grundläggande information och sätt upp klientprofilen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OnboardingForm 
                onComplete={() => handleStepComplete('onboard')}
              />
            </CardContent>
          </Card>
        );

      case 'assess':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Five Pillars Assessment för {selectedClient?.name}
              </CardTitle>
              <CardDescription>
                Genomför den modulära Five Pillars-bedömningen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModularPillarAssessment 
                clientId={selectedClient?.id}
                pillarKey="self_care"
                onComplete={() => handleStepComplete('assess')}
              />
            </CardContent>
          </Card>
        );

      case 'habits':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Vanformning för {selectedClient?.name}
              </CardTitle>
              <CardDescription>
                Skapa neuroplasticitet-baserade vanor baserat på assessment-resultaten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HabitFormationCenter 
                clientId={selectedClient?.id}
              />
            </CardContent>
          </Card>
        );

      case 'complete':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Onboarding komplett för {selectedClient?.name}! 🎉
              </CardTitle>
              <CardDescription>
                Klienten är nu redo att använda systemet fullt ut
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <h4 className="font-medium">Onboarding</h4>
                  <p className="text-sm text-muted-foreground">Genomförd</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <h4 className="font-medium">Assessment</h4>
                  <p className="text-sm text-muted-foreground">Genomförd</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <h4 className="font-medium">Vanor</h4>
                  <p className="text-sm text-muted-foreground">Aktiva</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={() => {
                  setSelectedClient(null);
                  setCurrentStep('create');
                }}>
                  Skapa nästa klient
                </Button>
                <Button variant="outline" onClick={() => {
                  // Use React Router navigation instead of window.location
                  setSelectedClient(null);
                  setCurrentStep('complete');
                }}>
                  Visa klientdashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      {selectedClient && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${currentStep === 'onboard' ? 'bg-primary' : 'bg-muted-foreground'}`} />
              <span className="text-sm">Onboarding</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${currentStep === 'assess' ? 'bg-primary' : 'bg-muted-foreground'}`} />
              <span className="text-sm">Assessment</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${currentStep === 'habits' ? 'bg-primary' : 'bg-muted-foreground'}`} />
              <span className="text-sm">Vanor</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${currentStep === 'complete' ? 'bg-green-500' : 'bg-muted-foreground'}`} />
              <span className="text-sm">Komplett</span>
            </div>
          </div>
          <div className="text-sm font-medium">{getStepTitle()}</div>
        </div>
      )}

      <Tabs defaultValue="workflow" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflow">Onboarding Workflow</TabsTrigger>
          <TabsTrigger value="clients">Alla Klienter ({clients.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="space-y-4">
          {renderCurrentStep()}
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <div className="grid gap-4">
            {clients.map((client) => {
              const { status, nextStep, color } = getClientStatus(client);
              return (
                <Card key={client.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {client.name}
                      </CardTitle>
                      <Badge variant="secondary" className={`text-white ${color}`}>
                        {status}
                      </Badge>
                    </div>
                    <CardDescription>{client.email}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          {client.onboarding_completed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-orange-500" />
                          )}
                          Onboarding
                        </div>
                        <div className="flex items-center gap-1">
                          {client.assessment_completed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-orange-500" />
                          )}
                          Assessment
                        </div>
                        <div className="flex items-center gap-1">
                          {client.habits_active > 0 ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-orange-500" />
                          )}
                          {client.habits_active} Vanor
                        </div>
                      </div>
                      <Button 
                        onClick={() => startOnboarding(client)}
                        variant={status === 'Komplett' ? 'outline' : 'default'}
                        size="sm"
                      >
                        {nextStep}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};