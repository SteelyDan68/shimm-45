import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Brain, 
  Users, 
  TrendingUp, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  RefreshCw,
  MessageSquare,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { NeuroplasticityHabit, SetbackEvent, HabitCategory, HabitDifficulty, HabitFrequency } from '@/types/habitFormation';
import { toast } from 'sonner';

interface AdminHabitManagementProps {
  onClose?: () => void;
}

export const AdminHabitManagement: React.FC<AdminHabitManagementProps> = ({ onClose }) => {
  const [allHabits, setAllHabits] = useState<NeuroplasticityHabit[]>([]);
  const [allSetbacks, setAllSetbacks] = useState<SetbackEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [clients, setClients] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState({
    neuroplasticity_cycles: 66,
    max_concurrent_habits: 5,
    ai_analysis_frequency: 7,
    auto_setback_detection: true,
    auto_recovery_planning: true,
    success_threshold_default: 7,
    difficulty_progression_enabled: true
  });
  const { toast: uiToast } = useToast();

  // Load all habit data for admin overview
  const loadHabitData = async () => {
    setIsLoading(true);
    try {
      // Load all clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');

      setClients(clientsData || []);

      // Load all habits
      const { data: habitsData } = await supabase
        .from('path_entries')
        .select('*')
        .contains('metadata', { is_habit: true })
        .order('created_at', { ascending: false });

      const habits = (habitsData || []).map(entry => {
        const metadata = entry.metadata as any;
        return metadata.habit_data as NeuroplasticityHabit;
      });

      setAllHabits(habits);

      // Load setbacks (would be stored in path_entries or separate table)
      const { data: setbacksData } = await supabase
        .from('path_entries')
        .select('*')
        .contains('metadata', { is_setback_event: true })
        .order('created_at', { ascending: false });

      const setbacks = (setbacksData || []).map(entry => {
        const metadata = entry.metadata as any;
        return metadata.setback_data as SetbackEvent;
      });

      setAllSetbacks(setbacks);

    } catch (error) {
      console.error('Error loading habit data:', error);
      uiToast({
        title: "Fel",
        description: "Kunde inte ladda vandata",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHabitData();
  }, []);

  // Filter habits by selected client
  const filteredHabits = selectedClient === 'all' 
    ? allHabits 
    : allHabits.filter(habit => habit.client_id === selectedClient);

  const filteredSetbacks = selectedClient === 'all' 
    ? allSetbacks 
    : allSetbacks.filter(setback => setback.client_id === selectedClient);

  // Calculate global statistics
  const globalStats = {
    totalHabits: allHabits.length,
    activeHabits: allHabits.filter(h => h.status === 'active').length,
    completedHabits: allHabits.filter(h => h.status === 'completed').length,
    totalClients: clients.length,
    clientsWithActiveHabits: [...new Set(allHabits.filter(h => h.status === 'active').map(h => h.client_id))].length,
    averageSuccessRate: allHabits.length > 0 
      ? allHabits.reduce((sum, habit) => sum + habit.success_rate, 0) / allHabits.length 
      : 0,
    totalSetbacks: allSetbacks.length,
    activeSetbacks: allSetbacks.filter(s => !s.resolved_at).length
  };

  // Force AI analysis for all habits
  const triggerGlobalAnalysis = async () => {
    setIsLoading(true);
    try {
      for (const habit of allHabits) {
        await supabase.functions.invoke('habit-pattern-analyzer', {
          body: {
            habit_data: habit,
            analysis_type: 'monthly_deep_dive',
            client_id: habit.client_id
          }
        });
      }
      
      toast.success(`AI-analys initierad för ${allHabits.length} vanor`);
    } catch (error) {
      toast.error('Fel vid global analys');
    } finally {
      setIsLoading(false);
    }
  };

  // Update global habit settings
  const updateGlobalSettings = async () => {
    try {
      // This would typically be stored in a settings table
      // For now, we'll create a system path entry
      await supabase
        .from('path_entries')
        .insert({
          client_id: 'system',
          type: 'system',
          title: 'Global Habit Settings Updated',
          details: 'Admin updated global habit formation settings',
          status: 'completed',
          ai_generated: false,
          created_by: 'admin',
          visible_to_client: false,
          metadata: {
            global_habit_settings: globalSettings,
            is_system_setting: true
          }
        });

      toast.success('Globala inställningar uppdaterade');
    } catch (error) {
      toast.error('Kunde inte uppdatera inställningar');
    }
  };

  // Reset a client's habits (for testing/debugging)
  const resetClientHabits = async (clientId: string) => {
    if (!confirm('Är du säker på att du vill återställa alla vanor för denna klient?')) return;

    try {
      await supabase
        .from('path_entries')
        .delete()
        .eq('client_id', clientId)
        .contains('metadata', { is_habit: true });

      await loadHabitData();
      toast.success('Klientens vanor återställda');
    } catch (error) {
      toast.error('Fel vid återställning');
    }
  };

  // Manually trigger setback detection
  const triggerSetbackDetection = async () => {
    setIsLoading(true);
    try {
      // This would call the setback detection logic for all active habits
      for (const habit of allHabits.filter(h => h.status === 'active')) {
        // Check if habit has been missed beyond threshold
        const lastCompletion = habit.completion_history[habit.completion_history.length - 1];
        if (lastCompletion) {
          const daysSince = Math.floor(
            (Date.now() - new Date(lastCompletion.completed_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysSince > 3) { // Simplified detection
            // Create setback event
            await supabase
              .from('path_entries')
              .insert({
                client_id: habit.client_id,
                type: 'alert',
                title: `⚠️ Bakslag upptäckt: ${habit.title}`,
                details: `${daysSince} dagar sedan senaste genomförande`,
                status: 'active',
                ai_generated: true,
                created_by: 'system',
                visible_to_client: true,
                metadata: {
                  setback_data: {
                    id: `setback_${Date.now()}`,
                    client_id: habit.client_id,
                    habit_id: habit.id,
                    setback_type: 'missed_days',
                    severity: daysSince > 7 ? 'major' : 'moderate',
                    detected_at: new Date().toISOString(),
                    context: { days_missed: daysSince }
                  },
                  is_setback_event: true
                }
              });
          }
        }
      }
      
      await loadHabitData();
      toast.success('Bakslagsdetektering genomförd');
    } catch (error) {
      toast.error('Fel vid bakslagsdetektering');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totala Vanor</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.totalHabits}</div>
            <p className="text-xs text-muted-foreground">
              {globalStats.activeHabits} aktiva, {globalStats.completedHabits} genomförda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiva Klienter</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.clientsWithActiveHabits}</div>
            <p className="text-xs text-muted-foreground">
              av {globalStats.totalClients} totalt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genomsnittlig Framgång</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.averageSuccessRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              Alla vanor
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiva Bakslag</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.activeSetbacks}</div>
            <p className="text-xs text-muted-foreground">
              av {globalStats.totalSetbacks} totalt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Administrativ Kontrollpanel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={triggerGlobalAnalysis} 
              disabled={isLoading}
              variant="outline"
            >
              <Brain className="h-4 w-4 mr-2" />
              Global AI-Analys
            </Button>
            
            <Button 
              onClick={triggerSetbackDetection} 
              disabled={isLoading}
              variant="outline"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Detektera Bakslag
            </Button>
            
            <Button 
              onClick={() => loadHabitData()} 
              disabled={isLoading}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Uppdatera Data
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Globala Inställningar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Globala Vaninställningar</DialogTitle>
                  <DialogDescription>
                    Konfigurera systemomfattande inställningar för vanformning
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="neuroplasticity_cycles">Neuroplasticitets-cykler (dagar)</Label>
                      <Input
                        id="neuroplasticity_cycles"
                        type="number"
                        value={globalSettings.neuroplasticity_cycles}
                        onChange={(e) => setGlobalSettings(prev => ({
                          ...prev,
                          neuroplasticity_cycles: parseInt(e.target.value)
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_concurrent">Max samtidiga vanor</Label>
                      <Input
                        id="max_concurrent"
                        type="number"
                        value={globalSettings.max_concurrent_habits}
                        onChange={(e) => setGlobalSettings(prev => ({
                          ...prev,
                          max_concurrent_habits: parseInt(e.target.value)
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto_setback">Automatisk bakslagsdetektering</Label>
                      <Switch
                        id="auto_setback"
                        checked={globalSettings.auto_setback_detection}
                        onCheckedChange={(checked) => setGlobalSettings(prev => ({
                          ...prev,
                          auto_setback_detection: checked
                        }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto_recovery">Automatisk återhämtningsplanering</Label>
                      <Switch
                        id="auto_recovery"
                        checked={globalSettings.auto_recovery_planning}
                        onCheckedChange={(checked) => setGlobalSettings(prev => ({
                          ...prev,
                          auto_recovery_planning: checked
                        }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="difficulty_progression">Automatisk svårighetsprogression</Label>
                      <Switch
                        id="difficulty_progression"
                        checked={globalSettings.difficulty_progression_enabled}
                        onCheckedChange={(checked) => setGlobalSettings(prev => ({
                          ...prev,
                          difficulty_progression_enabled: checked
                        }))}
                      />
                    </div>
                  </div>
                  
                  <Button onClick={updateGlobalSettings}>
                    Spara Inställningar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Client Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Klientfilter</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Välj klient" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla klienter</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs defaultValue="habits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="habits">Vanor ({filteredHabits.length})</TabsTrigger>
          <TabsTrigger value="setbacks">Bakslag ({filteredSetbacks.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analys</TabsTrigger>
        </TabsList>

        <TabsContent value="habits" className="space-y-4">
          <div className="grid gap-4">
            {filteredHabits.map((habit) => (
              <Card key={habit.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{habit.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={habit.status === 'active' ? 'default' : 'secondary'}>
                        {habit.status}
                      </Badge>
                      <Badge variant="outline">{habit.difficulty}</Badge>
                    </div>
                  </div>
                  <CardDescription>
                    Klient: {clients.find(c => c.id === habit.client_id)?.name || habit.client_id}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold">{habit.current_repetitions}</div>
                      <div className="text-xs text-muted-foreground">Repetitioner</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold">{habit.streak_current}</div>
                      <div className="text-xs text-muted-foreground">Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold">{habit.success_rate.toFixed(0)}%</div>
                      <div className="text-xs text-muted-foreground">Framgång</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold">{habit.ai_adjustments.length}</div>
                      <div className="text-xs text-muted-foreground">AI-justeringar</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => resetClientHabits(habit.client_id)}
                    >
                      Återställ Klient
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="setbacks" className="space-y-4">
          <div className="grid gap-4">
            {filteredSetbacks.map((setback) => (
              <Card key={setback.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      {setback.setback_type}
                    </CardTitle>
                    <Badge variant={setback.severity === 'major' ? 'destructive' : 'secondary'}>
                      {setback.severity}
                    </Badge>
                  </div>
                  <CardDescription>
                    {new Date(setback.detected_at).toLocaleDateString('sv-SE')} - 
                    Klient: {clients.find(c => c.id === setback.client_id)?.name || setback.client_id}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div><strong>Kontext:</strong> {JSON.stringify(setback.context)}</div>
                    {setback.recovery_plan && (
                      <Badge variant="outline">Återhämtningsplan aktiv</Badge>
                    )}
                    {setback.resolved_at && (
                      <Badge variant="outline">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Löst {new Date(setback.resolved_at).toLocaleDateString('sv-SE')}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Systemanalys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Vanor per kategori</h4>
                  {/* This would show distribution charts */}
                  <div className="text-sm text-muted-foreground">
                    Visualiseringar kommer att implementeras här
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-4">Framgångstrender</h4>
                  <div className="text-sm text-muted-foreground">
                    Trendanalyser kommer att implementeras här
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};