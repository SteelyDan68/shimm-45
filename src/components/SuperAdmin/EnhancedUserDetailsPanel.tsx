/**
 * 🔧 ENHANCED USER DETAILS PANEL 🔧
 * 
 * Komplett användarprofilsvisning med intelligence & pillar integration
 * Del av Unified User Command Center Phase 2
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, Brain, Target, Shield, Users, RefreshCw, Trash2, Edit3, 
  Plus, Phone, Building, Calendar, Star, TrendingUp, Activity,
  CheckCircle2, AlertTriangle, Clock, Mail, MapPin, Briefcase
} from 'lucide-react';
import { IntelligenceProfileView } from '@/components/Intelligence/IntelligenceProfileView';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EnhancedUserDetailsPanelProps {
  userData: {
    id: string;
    basicInfo: any;
    extendedProfile: any;
    intelligenceData: any;
    assessmentData: any;
    relationships: any;
  };
  onRoleChange: (userId: string, role: string, action: 'add' | 'remove') => void;
  onDeleteUser: (userId: string) => void;
  onRefresh: () => void;
  loading: boolean;
  canManageRoles: boolean;
  canDeleteUsers: boolean;
  canViewIntelligence: boolean;
}

export const EnhancedUserDetailsPanel: React.FC<EnhancedUserDetailsPanelProps> = ({
  userData,
  onRoleChange,
  onDeleteUser,
  onRefresh,
  loading,
  canManageRoles,
  canDeleteUsers,
  canViewIntelligence
}) => {
  const [activeDetailTab, setActiveDetailTab] = useState('overview');
  const [pillarData, setPillarData] = useState<any[]>([]);
  const [assessmentHistory, setAssessmentHistory] = useState<any[]>([]);
  const [loadingPillarData, setLoadingPillarData] = useState(false);
  const { toast } = useToast();

  // Load pillar and assessment data
  useEffect(() => {
    if (userData?.id) {
      loadPillarAndAssessmentData();
    }
  }, [userData?.id]);

  const loadPillarAndAssessmentData = async () => {
    setLoadingPillarData(true);
    try {
      // Try multiple data sources for pillar information
      let pillarActivations: any[] = [];
      let pillarAssessments: any[] = [];
      let pathEntries: any[] = [];

      // 1. Try path_entries first (newer system)
      try {
        const { data: pathData, error: pathError } = await supabase
          .from('path_entries')
          .select('*')
          .eq('user_id', userData.id)
          .in('type', ['pillar_activation', 'pillar_assessment', 'pillar_activity'])
          .order('created_at', { ascending: false });
        
        if (!pathError && pathData) {
          pathEntries = pathData;
        }
      } catch (error) {
        console.warn('Could not load from path_entries:', error);
      }

      // 2. Try pillar activations
      try {
        const { data: activations, error: activationError } = await supabase
          .from('user_pillar_activations')
          .select('*')
          .eq('user_id', userData.id);

        if (!activationError && activations) {
          pillarActivations = activations;
        }
      } catch (error) {
        console.warn('Could not load pillar activations:', error);
      }

      // 3. Try pillar assessments
      try {
        const { data: assessments, error: assessmentError } = await supabase
          .from('pillar_assessments')
          .select('*')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false });

        if (!assessmentError && assessments) {
          pillarAssessments = assessments;
        }
      } catch (error) {
        console.warn('Could not load pillar assessments:', error);
      }

      // 4. Try assessment rounds as fallback
      try {
        const { data: assessmentRounds, error: roundsError } = await supabase
          .from('assessment_rounds')
          .select('*')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!roundsError && assessmentRounds) {
          pillarAssessments = [...pillarAssessments, ...assessmentRounds];
        }
      } catch (error) {
        console.warn('Could not load assessment rounds:', error);
      }

      // Combine all data sources
      const combinedPillarData = [
        ...pillarActivations,
        ...pathEntries.filter(entry => entry.type === 'pillar_activation')
      ];

      const combinedAssessments = [
        ...pillarAssessments,
        ...pathEntries.filter(entry => ['pillar_assessment', 'pillar_activity'].includes(entry.type))
      ];

      setPillarData(combinedPillarData);
      setAssessmentHistory(combinedAssessments);

      console.log(`Loaded ${combinedPillarData.length} pillar records and ${combinedAssessments.length} assessments`);

    } catch (error) {
      console.error('Error loading pillar data:', error);
      // Set empty data instead of showing error for missing pillar data
      setPillarData([]);
      setAssessmentHistory([]);
    } finally {
      setLoadingPillarData(false);
    }
  };

  const formatLastActive = (timestamp: string) => {
    if (!timestamp) return 'Aldrig';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Idag';
    if (diffDays === 1) return 'Igår';
    if (diffDays < 7) return `${diffDays} dagar sedan`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} veckor sedan`;
    return date.toLocaleDateString('sv-SE');
  };

  const getPillarScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
              {userData.basicInfo?.name?.charAt(0) || '?'}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{userData.basicInfo?.name || 'Okänd användare'}</h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{userData.basicInfo?.email}</span>
              </div>
              <div className="flex gap-2 mt-2">
                {userData.basicInfo?.roles?.map((role: string) => (
                  <Badge key={role} variant="outline" className="capitalize">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            {canDeleteUsers && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => onDeleteUser(userData.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-hidden">
        <Tabs value={activeDetailTab} onValueChange={setActiveDetailTab} className="h-full flex flex-col">
          <div className="px-6 border-b flex-shrink-0">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Översikt</TabsTrigger>
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="roles">Roller</TabsTrigger>
              <TabsTrigger value="pillars">Pillars</TabsTrigger>
              <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Overview Tab */}
            <TabsContent value="overview" className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold">
                      {formatLastActive(userData.basicInfo?.updated_at)}
                    </div>
                    <div className="text-sm text-muted-foreground">Senast aktiv</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Target className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold">{pillarData.length}</div>
                    <div className="text-sm text-muted-foreground">Aktiva pillars</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold">{assessmentHistory.length}</div>
                    <div className="text-sm text-muted-foreground">Genomförda assessments</div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Pillar Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    Pillar Progress (Snabböversikt)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingPillarData ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Laddar pillar-data...</span>
                    </div>
                  ) : pillarData.length === 0 ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Inga aktiva pillars. Användaren har inte påbörjat några pillar-assessments än.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pillarData.slice(0, 4).map((pillar) => (
                        <div key={pillar.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium capitalize">
                              {pillar.pillar_key?.replace('_', ' ')}
                            </span>
                            <Badge variant="outline">
                              {pillar.is_active ? 'Aktiv' : 'Inaktiv'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Aktiverad: {new Date(pillar.activated_at).toLocaleDateString('sv-SE')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Assessments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Senaste Assessments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assessmentHistory.length === 0 ? (
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        Inga assessments genomförda än.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-3">
                      {assessmentHistory.slice(0, 3).map((assessment) => (
                        <div key={assessment.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-medium capitalize">
                                {assessment.pillar_type?.replace('_', ' ') || 'Allmän assessment'}
                              </span>
                              <div className="text-sm text-muted-foreground">
                                {new Date(assessment.created_at).toLocaleDateString('sv-SE')}
                              </div>
                            </div>
                            <Badge variant="outline">Genomförd</Badge>
                          </div>
                          {assessment.ai_analysis && (
                            <div className="text-sm text-muted-foreground">
                              {assessment.ai_analysis.substring(0, 100)}...
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Grundläggande information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">E-post:</span>
                      <span>{userData.basicInfo?.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Namn:</span>
                      <span>{userData.basicInfo?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Skapad:</span>
                      <span>{new Date(userData.basicInfo?.created_at).toLocaleDateString('sv-SE')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Status:</span>
                      <Badge variant="outline">Aktiv</Badge>
                    </div>
                  </div>
                </div>

                {userData.extendedProfile && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Utökad profil
                    </h3>
                    <div className="space-y-3">
                      {userData.extendedProfile.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Telefon:</span>
                          <span>{userData.extendedProfile.phone}</span>
                        </div>
                      )}
                      {userData.extendedProfile.organization && (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Organisation:</span>
                          <span>{userData.extendedProfile.organization}</span>
                        </div>
                      )}
                      {userData.extendedProfile.bio && (
                        <div>
                          <span className="font-medium">Bio:</span>
                          <p className="text-sm text-muted-foreground mt-1">
                            {userData.extendedProfile.bio}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Roles Tab */}
            <TabsContent value="roles" className="p-6">
              <div className="space-y-6">
                <h3 className="font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Rollhantering
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Nuvarande roller</h4>
                    <div className="space-y-2">
                      {userData.basicInfo?.roles?.length > 0 ? (
                        userData.basicInfo.roles.map((role: string) => (
                          <div key={role} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-blue-600" />
                              <Badge variant="outline" className="capitalize">{role}</Badge>
                            </div>
                            {canManageRoles && (
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => onRoleChange(userData.id, role, 'remove')}
                              >
                                Ta bort
                              </Button>
                            )}
                          </div>
                        ))
                      ) : (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Inga roller tilldelade.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>

                  {canManageRoles && (
                    <div>
                      <h4 className="text-sm font-medium mb-3">Tilldela ny roll</h4>
                      <div className="space-y-2">
                        {['superadmin', 'admin', 'coach', 'client'].map((role) => (
                          <Button
                            key={role}
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => onRoleChange(userData.id, role, 'add')}
                            disabled={userData.basicInfo?.roles?.includes(role)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {role}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Relationships */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Relationer
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium mb-2">Som Coach</h5>
                      {userData.relationships?.asCoach?.length > 0 ? (
                        <div className="space-y-2">
                          {userData.relationships.asCoach.map((client: any) => (
                            <div key={client.id} className="p-2 border rounded">
                              <div className="font-medium">{client.name}</div>
                              <div className="text-sm text-muted-foreground">{client.email}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Inga tilldelade klienter</p>
                      )}
                    </div>

                    <div>
                      <h5 className="text-sm font-medium mb-2">Som Klient</h5>
                      {userData.relationships?.asClient ? (
                        <div className="p-2 border rounded">
                          <div className="font-medium">{userData.relationships.asClient.name}</div>
                          <div className="text-sm text-muted-foreground">{userData.relationships.asClient.email}</div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Ingen tilldelad coach</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Pillars Tab */}
            <TabsContent value="pillars" className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    Six Pillars Progress & Assessments
                  </h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadPillarAndAssessmentData}
                    disabled={loadingPillarData}
                  >
                    {loadingPillarData ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {loadingPillarData ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Laddar detaljerad pillar-data...</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Active Pillars */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Aktiva Pillars</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {pillarData.length === 0 ? (
                          <Alert>
                            <Target className="h-4 w-4" />
                            <AlertDescription>
                              Inga pillars aktiverade än. Användaren behöver starta sin pillar-resa.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pillarData.map((pillar) => (
                              <div key={pillar.id} className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium capitalize">
                                    {pillar.pillar_key?.replace('_', ' ')}
                                  </h4>
                                  <Badge variant={pillar.is_active ? "default" : "secondary"}>
                                    {pillar.is_active ? 'Aktiv' : 'Inaktiv'}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span>Aktiverad:</span>
                                    <span>{new Date(pillar.activated_at).toLocaleDateString('sv-SE')}</span>
                                  </div>
                                  {pillar.activated_by && (
                                    <div className="flex justify-between">
                                      <span>Aktiverad av:</span>
                                      <span className="text-muted-foreground">ID: {pillar.activated_by}</span>
                                    </div>
                                  )}
                                </div>

                                {pillar.pillar_assessments?.length > 0 && (
                                  <div className="mt-3 pt-3 border-t">
                                    <div className="text-sm font-medium mb-2">
                                      Senaste assessment: {new Date(pillar.pillar_assessments[0].created_at).toLocaleDateString('sv-SE')}
                                    </div>
                                    {pillar.pillar_assessments[0].ai_analysis && (
                                      <div className="text-xs text-muted-foreground">
                                        {pillar.pillar_assessments[0].ai_analysis.substring(0, 150)}...
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Assessment History */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Assessment-historik</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {assessmentHistory.length === 0 ? (
                          <Alert>
                            <Clock className="h-4 w-4" />
                            <AlertDescription>
                              Inga assessments genomförda än.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <div className="space-y-4">
                            {assessmentHistory.map((assessment) => (
                              <div key={assessment.id} className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <h4 className="font-medium">
                                      {assessment.pillar_type ? (
                                        <span className="capitalize">
                                          {assessment.pillar_type.replace('_', ' ')} Assessment
                                        </span>
                                      ) : (
                                        'Allmän Assessment'
                                      )}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(assessment.created_at).toLocaleDateString('sv-SE', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                  <Badge variant="outline">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Genomförd
                                  </Badge>
                                </div>

                                {assessment.scores && (
                                  <div className="mb-3">
                                    <h5 className="text-sm font-medium mb-2">Resultat:</h5>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                      {Object.entries(assessment.scores).map(([key, value]) => (
                                        <div key={key} className="text-center p-2 bg-muted rounded">
                                          <div className="text-sm font-medium">{value as string}</div>
                                          <div className="text-xs text-muted-foreground capitalize">
                                            {key.replace('_', ' ')}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {assessment.ai_analysis && (
                                  <div>
                                    <h5 className="text-sm font-medium mb-2">AI-analys:</h5>
                                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                                      {assessment.ai_analysis}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Intelligence Tab */}
            <TabsContent value="intelligence" className="h-full">
              {canViewIntelligence ? (
                <div className="h-full">
                  {userData.intelligenceData ? (
                    <IntelligenceProfileView
                      profile={userData.intelligenceData}
                      onRefresh={onRefresh}
                      loading={loading}
                      canExport={true}
                      canViewSensitiveData={true}
                    />
                  ) : (
                    <div className="p-6">
                      <Alert>
                        <Brain className="h-4 w-4" />
                        <AlertDescription>
                          Ingen intelligence-data tillgänglig för denna användare. 
                          Data kan laddas automatiskt eller behöva samlas in manuellt.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Du har inte behörighet att visa intelligence-data.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};