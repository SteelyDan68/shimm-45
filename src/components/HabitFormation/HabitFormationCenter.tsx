import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useHabitFormation } from '@/hooks/useHabitFormation';
import { useAuth } from '@/hooks/useAuth';
import { 
  Target, 
  Zap, 
  Brain, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Plus,
  BarChart3,
  Calendar,
  Settings
} from 'lucide-react';
import type { HabitDifficulty, HabitFrequency, HabitCategory } from '@/types/habitFormation';

interface HabitFormationCenterProps {
  clientId?: string;
}

export const HabitFormationCenter: React.FC<HabitFormationCenterProps> = ({ clientId }) => {
  const { user } = useAuth();
  const currentClientId = clientId || user?.id;
  const { 
    habits, 
    analytics, 
    activeSetbacks, 
    isLoading,
    createHabit,
    completeHabit,
    detectSetbacks
  } = useHabitFormation(currentClientId);

  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string>('');

  // Create habit form state
  const [habitForm, setHabitForm] = useState({
    title: '',
    description: '',
    category: 'self_care' as HabitCategory,
    frequency: 'daily' as HabitFrequency,
    difficulty: 'micro' as HabitDifficulty,
    initial_commitment: '',
    current_commitment: '',
    repetition_goal: 66, // Standard neuroplasticity formation period
    consistency_threshold: 80,
    preferred_time_of_day: '',
    context_cues: [''],
    reward_mechanism: '',
    progression_rules: {
      success_threshold: 7,
      increase_factor: 1.2,
      max_difficulty: 'challenging'
    },
    personalization_data: {},
    status: 'active' as const,
    created_by: user?.id || ''
  });

  // Completion form state
  const [completionForm, setCompletionForm] = useState({
    completion_quality: 7,
    context_notes: '',
    mood_before: 5,
    mood_after: 7,
    difficulty_felt: 5,
    environmental_factors: ['']
  });

  useEffect(() => {
    if (user?.id) {
      // Check for setbacks on component mount
      setTimeout(detectSetbacks, 2000);
    }
  }, [user?.id, detectSetbacks]);

  const handleCreateHabit = async () => {
    const success = await createHabit({
      ...habitForm,
      user_id: user?.id || '',
      current_commitment: habitForm.initial_commitment
    });
    
    if (success) {
      setShowCreateForm(false);
      setHabitForm({
        title: '',
        description: '',
        category: 'self_care',
        frequency: 'daily',
        difficulty: 'micro',
        initial_commitment: '',
        current_commitment: '',
        repetition_goal: 66,
        consistency_threshold: 80,
        preferred_time_of_day: '',
        context_cues: [''],
        reward_mechanism: '',
        progression_rules: {
          success_threshold: 7,
          increase_factor: 1.2,
          max_difficulty: 'challenging'
        },
        personalization_data: {},
        status: 'active',
        created_by: user?.id || ''
      });
    }
  };

  const handleCompleteHabit = async () => {
    if (!selectedHabitId) return;
    
    const success = await completeHabit(selectedHabitId, completionForm);
    if (success) {
      setSelectedHabitId('');
      setCompletionForm({
        completion_quality: 7,
        context_notes: '',
        mood_before: 5,
        mood_after: 7,
        difficulty_felt: 5,
        environmental_factors: ['']
      });
    }
  };

  const activeHabits = habits.filter(h => h.status === 'active');
  const completedHabits = habits.filter(h => h.status === 'completed');

  const getDifficultyColor = (difficulty: HabitDifficulty) => {
    switch (difficulty) {
      case 'micro': return 'bg-green-100 text-green-800';
      case 'small': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'large': return 'bg-orange-100 text-orange-800';
      case 'challenging': return 'bg-red-100 text-red-800';
    }
  };

  const getNeuroplasticityProgress = (habit: any) => {
    return Math.min((habit.current_repetitions / habit.repetition_goal) * 100, 100);
  };

  const getNeuroplasticityPhase = (progress: number) => {
    if (progress < 20) return { phase: 'Initiering', color: 'red', description: 'Nya neurala vägar bildas' };
    if (progress < 40) return { phase: 'Etablering', color: 'orange', description: 'Förstärkning av kopplingar' };
    if (progress < 66) return { phase: 'Stabilisering', color: 'yellow', description: 'Myelinisering påbörjas' };
    if (progress < 90) return { phase: 'Automatisering', color: 'blue', description: 'Stark neural pathway' };
    return { phase: 'Neuroplasticitet uppnådd', color: 'green', description: 'Permanent neural förändring' };
  };

  const getOptimalChallengeLevel = (habit: any) => {
    const successRate = habit.success_rate;
    const currentDifficulty = habit.difficulty;
    
    if (successRate > 85 && currentDifficulty !== 'challenging') {
      return 'Redo för nästa nivå! Öka utmaningen för optimal neuroplasticitet.';
    } else if (successRate < 70 && currentDifficulty !== 'micro') {
      return 'Minska utmaningen för att bibehålla konsistens och neurala förstärkningar.';
    }
    return 'Perfekt balans för neuroplasticitet-utveckling!';
  };

  const getCategoryIcon = (category: HabitCategory) => {
    switch (category) {
      case 'self_care': return '💚';
      case 'skills': return '🧠';
      case 'talent': return '⭐';
      case 'brand': return '🎯';
      case 'economy': return '💰';
      case 'meta': return '🔄';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Quick Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Neuroplasticitet & Vanbildning
              </CardTitle>
              <CardDescription>
                Vetenskapsbaserad vanbildning genom konsekventa, progressiva steg
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ny vana
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{activeHabits.length}</div>
              <div className="text-xs text-muted-foreground">Aktiva vanor</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {activeHabits.reduce((sum, h) => sum + h.streak_current, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {activeHabits.length > 0 
                  ? Math.round(activeHabits.reduce((sum, h) => sum + h.success_rate, 0) / activeHabits.length)
                  : 0}%
              </div>
              <div className="text-xs text-muted-foreground">Genomsnittlig framgång</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{activeSetbacks.length}</div>
              <div className="text-xs text-muted-foreground">Aktiva återhämtningar</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Setbacks Alert */}
      {activeSetbacks.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              Återhämtning pågår
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeSetbacks.map(setback => (
                <div key={setback.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <div className="font-medium">{setback.setback_type.replace('_', ' ')}</div>
                    <div className="text-sm text-muted-foreground">
                      Allvarlighetsgrad: {setback.severity} | Upptäckt: {new Date(setback.detected_at).toLocaleDateString('sv-SE')}
                    </div>
                  </div>
                  <Badge variant="outline">Stefan arbetar på lösning</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Översikt
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Aktiva vanor
          </TabsTrigger>
          <TabsTrigger value="complete" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Genomför
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Analys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            {activeHabits.map(habit => (
              <Card key={habit.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getCategoryIcon(habit.category)}</div>
                      <div>
                        <CardTitle className="text-base">{habit.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getDifficultyColor(habit.difficulty)}>
                            {habit.difficulty}
                          </Badge>
                          <Badge variant="outline">{habit.frequency}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{habit.streak_current}</div>
                      <div className="text-xs text-muted-foreground">dagar</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Neuroplasticitet-framsteg</span>
                      <span>{Math.round(getNeuroplasticityProgress(habit))}%</span>
                    </div>
                    <Progress value={getNeuroplasticityProgress(habit)} className="h-2" />
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-xs text-muted-foreground">
                        {habit.current_repetitions} av {habit.repetition_goal} repetitioner
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getNeuroplasticityPhase(getNeuroplasticityProgress(habit)).phase}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getNeuroplasticityPhase(getNeuroplasticityProgress(habit)).description}
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Framgångsgrad:</span>
                    <span className="font-medium">{Math.round(habit.success_rate)}%</span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <strong>Nuvarande åtagande:</strong> {habit.current_commitment}
                  </div>

                  {/* Neuroplasticity Optimization Hint */}
                  <div className="p-2 bg-blue-50 rounded text-xs text-blue-800">
                    💡 {getOptimalChallengeLevel(habit)}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedHabitId(habit.id)}
                      className="flex-1"
                    >
                      Genomför nu
                    </Button>
                    {habit.success_rate > 85 && (
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => console.log('Level up habit:', habit.id)}
                      >
                        📈 Nivå upp
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Alla aktiva vanor</CardTitle>
              <CardDescription>
                Hantera och övervaka dina pågående neuroplasticitet-vanor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeHabits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-4" />
                  <p>Inga aktiva vanor än</p>
                  <p className="text-sm">Skapa din första neuroplasticitet-vana för att komma igång</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeHabits.map(habit => (
                    <div key={habit.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-xl">{getCategoryIcon(habit.category)}</div>
                          <div>
                            <h3 className="font-semibold">{habit.title}</h3>
                            <p className="text-sm text-muted-foreground">{habit.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Badge className={getDifficultyColor(habit.difficulty)}>
                              {habit.difficulty}
                            </Badge>
                            <Zap className="w-4 h-4 text-yellow-600" />
                            <span className="font-bold">{habit.streak_current}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Frekvens</div>
                          <div className="text-muted-foreground">{habit.frequency}</div>
                        </div>
                        <div>
                          <div className="font-medium">Framgång</div>
                          <div className="text-muted-foreground">{Math.round(habit.success_rate)}%</div>
                        </div>
                        <div>
                          <div className="font-medium">Repetitioner</div>
                          <div className="text-muted-foreground">
                            {habit.current_repetitions}/{habit.repetition_goal}
                          </div>
                        </div>
                      </div>

                      {habit.context_cues.length > 0 && (
                        <div className="mt-3">
                          <div className="text-sm font-medium mb-1">Triggers:</div>
                          <div className="flex flex-wrap gap-1">
                            {habit.context_cues.map((cue, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {cue}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complete">
          <Card>
            <CardHeader>
              <CardTitle>Genomför vana</CardTitle>
              <CardDescription>
                Registrera genomförandet av en vana för att bygga neuroplasticitet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedHabitId ? (
                <div>
                  <Label>Välj vana att genomföra</Label>
                  <Select value={selectedHabitId} onValueChange={setSelectedHabitId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj en vana..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      {activeHabits.map(habit => (
                        <SelectItem key={habit.id} value={habit.id}>
                          {getCategoryIcon(habit.category)} {habit.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold">
                      {getCategoryIcon(activeHabits.find(h => h.id === selectedHabitId)?.category)} 
                      {activeHabits.find(h => h.id === selectedHabitId)?.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {activeHabits.find(h => h.id === selectedHabitId)?.current_commitment}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Humör före (1-10)</Label>
                      <Select 
                        value={completionForm.mood_before.toString()} 
                        onValueChange={(value) => setCompletionForm(prev => ({ ...prev, mood_before: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border z-50">
                          {[1,2,3,4,5,6,7,8,9,10].map(num => (
                            <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Humör efter (1-10)</Label>
                      <Select 
                        value={completionForm.mood_after.toString()} 
                        onValueChange={(value) => setCompletionForm(prev => ({ ...prev, mood_after: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border z-50">
                          {[1,2,3,4,5,6,7,8,9,10].map(num => (
                            <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Kvalitet på genomförandet (1-10)</Label>
                    <Select 
                      value={completionForm.completion_quality.toString()} 
                      onValueChange={(value) => setCompletionForm(prev => ({ ...prev, completion_quality: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50">
                        {[1,2,3,4,5,6,7,8,9,10].map(num => (
                          <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Hur svårt kändes det? (1-10)</Label>
                    <Select 
                      value={completionForm.difficulty_felt.toString()} 
                      onValueChange={(value) => setCompletionForm(prev => ({ ...prev, difficulty_felt: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50">
                        {[1,2,3,4,5,6,7,8,9,10].map(num => (
                          <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Reflektion (frivilligt)</Label>
                    <Textarea
                      value={completionForm.context_notes}
                      onChange={(e) => setCompletionForm(prev => ({ ...prev, context_notes: e.target.value }))}
                      placeholder="Hur kändes det? Vad funkar bra? Vad kan förbättras?"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedHabitId('')}
                      className="flex-1"
                    >
                      Avbryt
                    </Button>
                    <Button 
                      onClick={handleCompleteHabit}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? 'Sparar...' : 'Genomförd!'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Vananalys & Neuroplasticitet</CardTitle>
              <CardDescription>
                Djup analys av dina vanmönster och hjärnförändringar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4" />
                <p>Avancerad vananalys kommer snart...</p>
                <p className="text-sm">
                  Stefan kommer att analysera dina vanmönster och ge personaliserade insikter
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Habit Modal/Form */}
      {showCreateForm && (
        <Card className="fixed inset-4 md:inset-x-1/4 md:inset-y-16 z-50 overflow-auto">
          <CardHeader>
            <CardTitle>Skapa neuroplasticitet-vana</CardTitle>
            <CardDescription>
              Bygg en ny vana baserad på hjärnforskning - börja mikro, bygg gradvis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Titel</Label>
              <Input
                value={habitForm.title}
                onChange={(e) => setHabitForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="T.ex. Morgonyoga, Läsa 10 minuter, Dricka vatten"
              />
            </div>

            <div className="space-y-2">
              <Label>Beskrivning</Label>
              <Textarea
                value={habitForm.description}
                onChange={(e) => setHabitForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Varför är denna vana viktig för dig?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select 
                  value={habitForm.category} 
                  onValueChange={(value: HabitCategory) => setHabitForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="self_care">💚 Self Care</SelectItem>
                    <SelectItem value="skills">🧠 Skills</SelectItem>
                    <SelectItem value="talent">⭐ Talent</SelectItem>
                    <SelectItem value="brand">🎯 Brand</SelectItem>
                    <SelectItem value="economy">💰 Economy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Frekvens</Label>
                <Select 
                  value={habitForm.frequency} 
                  onValueChange={(value: HabitFrequency) => setHabitForm(prev => ({ ...prev, frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="daily">Daglig</SelectItem>
                    <SelectItem value="weekly">Veckovis</SelectItem>
                    <SelectItem value="biweekly">Varannan vecka</SelectItem>
                    <SelectItem value="monthly">Månadsvis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Startsvårighet (börja VÄLDIGT litet!)</Label>
              <Select 
                value={habitForm.difficulty} 
                onValueChange={(value: HabitDifficulty) => setHabitForm(prev => ({ ...prev, difficulty: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="micro">🟢 Micro (30 sek - 2 min)</SelectItem>
                  <SelectItem value="small">🔵 Small (2-5 min)</SelectItem>
                  <SelectItem value="medium">🟡 Medium (5-15 min)</SelectItem>
                  <SelectItem value="large">🟠 Large (15-30 min)</SelectItem>
                  <SelectItem value="challenging">🔴 Challenging (30+ min)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Minimalt åtagande (det du ALLTID kan göra)</Label>
              <Input
                value={habitForm.initial_commitment}
                onChange={(e) => setHabitForm(prev => ({ ...prev, initial_commitment: e.target.value }))}
                placeholder="T.ex. '1 djup andetag', '5 armhävningar', 'öppna boken'"
              />
            </div>

            <div className="space-y-2">
              <Label>Triggers/Cues (vad påminner dig?)</Label>
              <Input
                value={habitForm.context_cues[0]}
                onChange={(e) => setHabitForm(prev => ({ 
                  ...prev, 
                  context_cues: [e.target.value, ...prev.context_cues.slice(1)] 
                }))}
                placeholder="T.ex. 'efter kaffe', 'innan dusch', 'alarm 07:00'"
              />
            </div>

            <div className="space-y-2">
              <Label>Belöning</Label>
              <Input
                value={habitForm.reward_mechanism}
                onChange={(e) => setHabitForm(prev => ({ ...prev, reward_mechanism: e.target.value }))}
                placeholder="Hur belönar du dig själv efter genomförandet?"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
                className="flex-1"
              >
                Avbryt
              </Button>
              <Button 
                onClick={handleCreateHabit}
                disabled={!habitForm.title || !habitForm.initial_commitment || isLoading}
                className="flex-1"
              >
                {isLoading ? 'Skapar...' : 'Skapa vana'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};