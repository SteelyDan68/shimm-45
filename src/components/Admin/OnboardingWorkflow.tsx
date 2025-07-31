import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface ClientProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  status: string;
  created_at: string;
  roles?: string[];
  onboarding_completed?: boolean;
  assessment_completed?: boolean;
  habits_active?: number;
}

interface OnboardingWorkflowProps {
  onClose?: () => void;
}

export const OnboardingWorkflow: React.FC<OnboardingWorkflowProps> = ({ onClose }) => {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [currentStep, setCurrentStep] = useState<'create' | 'onboard' | 'assess' | 'habits' | 'complete'>('create');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadClients = async () => {
    try {
      // Fetch clients and their profiles directly from database
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          status,
          created_at,
          profile_extended
        `)
        .eq('status', 'active');

      if (error) throw error;

      // Filter only clients (users with client role)
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'client');

      if (rolesError) throw rolesError;

      const clientUserIds = new Set(userRoles?.map(ur => ur.user_id) || []);
      
      // Map to the expected format for this component
      const clientProfiles = profiles?.filter(profile => clientUserIds.has(profile.id)).map(client => ({
        id: client.id,
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email,
        status: client.status || 'active',
        created_at: client.created_at,
        roles: ['client'], // Since these are already filtered as clients
        onboarding_completed: (client.profile_extended as any)?.onboarding_completed || false,
        assessment_completed: (client.profile_extended as any)?.assessment_completed || false,
        habits_active: (client.profile_extended as any)?.habits_active || 0
      })) || [];

      console.log('Client profiles loaded (OnboardingWorkflow):', clientProfiles.length, clientProfiles.map(c => `${c.first_name} ${c.last_name}`));
      setClients(clientProfiles);
    } catch (error: any) {
      console.error('Error loading clients:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda klienter",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const getClientStatus = (client: ClientProfile): { status: string; nextStep: string; color: string } => {
    if (!client.onboarding_completed) {
      return { status: 'Behöver onboarding', nextStep: 'Genomför onboarding', color: 'bg-orange-500' };
    }
    if (!client.assessment_completed) {
      return { status: 'Behöver assessment', nextStep: 'Genomför Five Pillars', color: 'bg-blue-500' };
    }
    if ((client.habits_active || 0) === 0) {
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

  const startOnboarding = (client: ClientProfile) => {
    console.log('🔥 startOnboarding called for client:', client);
    console.log('🔥 Client onboarding status:', client.onboarding_completed);
    setSelectedClient(client);
    
    if (!client.onboarding_completed) {
      console.log('🔥 Setting step to onboard');
      setCurrentStep('onboard');
    } else if (!client.assessment_completed) {
      console.log('🔥 Setting step to assess');
      setCurrentStep('assess');
    } else if ((client.habits_active || 0) === 0) {
      console.log('🔥 Setting step to habits');
      setCurrentStep('habits');
    } else {
      console.log('🔥 Setting step to complete');
      setCurrentStep('complete');
    }
    
    console.log('🔥 Selected client after update:', selectedClient);
    console.log('🔥 Current step after update:', currentStep);
  };

  const handleStepComplete = async (step: string) => {
    switch (step) {
      case 'onboard':
        // Mark onboarding as completed in the database
        if (selectedClient) {
          await markOnboardingCompleted(selectedClient.id);
        }
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

  const markOnboardingCompleted = async (clientId: string) => {
    try {
      // Update the client's profile to mark onboarding as completed
      const { error } = await supabase
        .from('profiles')
        .update({ 
          profile_extended: { 
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString()
          }
        })
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: "Onboarding slutförd! 🎉",
        description: "Klienten kan nu fortsätta till nästa steg.",
      });
    } catch (error: any) {
      console.error('Error marking onboarding completed:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara onboarding-status",
        variant: "destructive"
      });
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

  const getClientDisplayName = (client: ClientProfile): string => {
    return `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email || 'Okänd användare';
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
                Skapa ny klient-användare
              </CardTitle>
              <CardDescription>
                Skapa en ny användare och tilldela rollen "Klient"
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
                Onboarding för {getClientDisplayName(selectedClient!)}
              </CardTitle>
              <CardDescription>
                Samla grundläggande information och sätt upp klientprofilen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OnboardingForm 
                onComplete={(data) => {
                  console.log('Onboarding completed with data:', data);
                  handleStepComplete('onboard');
                }}
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
                Five Pillars Assessment för {getClientDisplayName(selectedClient!)}
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
                Vanformning för {getClientDisplayName(selectedClient!)}
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
                Onboarding komplett för {getClientDisplayName(selectedClient!)}! 🎉
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

      <Tabs value={selectedClient ? "workflow" : "clients"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflow">
            Onboarding Workflow {selectedClient && `(${getClientDisplayName(selectedClient)})`}
          </TabsTrigger>
          <TabsTrigger value="clients">Klient-användare ({clients.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="space-y-4">
          {renderCurrentStep()}
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Klient-användare
              </CardTitle>
              <CardDescription>
                Alla användare med rollen "Klient" i systemet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clients.length > 0 ? (
                <div className="space-y-4">
                  {clients.map((client) => {
                    const { status, nextStep, color } = getClientStatus(client);
                    return (
                      <div 
                        key={client.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <h4 className="font-medium">{getClientDisplayName(client)}</h4>
                            <p className="text-sm text-muted-foreground">{client.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={`text-white ${color}`}>
                            {status}
                          </Badge>
                          <Button 
                            onClick={() => {
                              console.log('🔥 Button clicked for client:', client);
                              console.log('🔥 Client status:', { status, nextStep });
                              startOnboarding(client);
                            }}
                            variant={status === 'Komplett' ? 'outline' : 'default'}
                            size="sm"
                            className="bg-primary hover:bg-primary/90"
                          >
                            {nextStep}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Inga klient-användare hittades. Skapa en ny användare med rollen "Klient" för att komma igång.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};