import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Play,
  Pause,
  RotateCcw,
  Target,
  Zap
} from 'lucide-react';

interface CalendarActionable {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  scheduled_date: string;
  estimated_duration: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  neuroplasticity_day?: number;
  completion_status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completion_percentage: number;
  user_notes?: string;
  pillar_key: string;
  ai_generated: boolean;
}

interface ActionableTimelineData {
  timeline_duration: number;
  weekly_goals: Array<{
    week: number;
    title: string;
    description: string;
    actionables: Array<{
      title: string;
      description: string;
      duration_minutes: number;
      neuroplastic_type: string;
      frequency: string;
      success_metrics: string;
    }>;
  }>;
  daily_micro_actions: Array<{
    title: string;
    description: string;
    neuroplastic_principle: string;
    suggested_times: string[];
  }>;
  milestone_checkpoints: Array<{
    day: number;
    title: string;
    assessment_questions: string[];
    celebration_suggestion: string;
  }>;
}

interface CalendarActionableManagerProps {
  userId: string;
  pillarKey?: string;
  timelineData?: ActionableTimelineData;
  onActionableComplete?: (actionableId: string) => void;
}

export const CalendarActionableManager = ({ 
  userId, 
  pillarKey, 
  timelineData,
  onActionableComplete 
}: CalendarActionableManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [actionables, setActionables] = useState<CalendarActionable[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentView, setCurrentView] = useState<'calendar' | 'list' | 'timeline'>('calendar');

  // Ladda actionables för användaren
  const loadActionables = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('calendar_actionables')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: true });

      if (pillarKey) {
        query = query.eq('pillar_key', pillarKey);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Type guard för att säkerställa korrekt typing
      const typedActionables: CalendarActionable[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        title: item.title,
        description: item.description,
        scheduled_date: item.scheduled_date,
        estimated_duration: item.estimated_duration,
        priority: ['low', 'medium', 'high', 'critical'].includes(item.priority) 
          ? item.priority as CalendarActionable['priority']
          : 'medium',
        neuroplasticity_day: item.neuroplasticity_day,
        completion_status: ['pending', 'in_progress', 'completed', 'skipped'].includes(item.completion_status)
          ? item.completion_status as CalendarActionable['completion_status']
          : 'pending',
        completion_percentage: item.completion_percentage || 0,
        user_notes: item.user_notes,
        pillar_key: item.pillar_key,
        ai_generated: item.ai_generated || false
      }));

      setActionables(typedActionables);
    } catch (error) {
      console.error('Error loading actionables:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda din utvecklingsplan.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generera actionables från timeline data
  const generateActionablesFromTimeline = async () => {
    if (!user || !timelineData || !pillarKey) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-actionable-timeline', {
        body: {
          user_id: user.id,
          pillar_key: pillarKey,
          assessment_data: timelineData,
          journey_preferences: {
            duration: timelineData.timeline_duration,
            intensity: 'moderate'
          }
        }
      });

      if (error) throw error;

      // Konvertera timeline till calendar actionables
      const newActionables: Partial<CalendarActionable>[] = [];
      const startDate = new Date();

      // Lägg till veckovisa mål
      timelineData.weekly_goals.forEach((week, weekIndex) => {
        week.actionables.forEach((actionable, actionableIndex) => {
          const scheduleDate = new Date(startDate);
          scheduleDate.setDate(startDate.getDate() + (weekIndex * 7) + actionableIndex);

          newActionables.push({
            user_id: user.id,
            pillar_key: pillarKey,
            title: actionable.title,
            description: actionable.description,
            scheduled_date: scheduleDate.toISOString(),
            estimated_duration: actionable.duration_minutes,
            priority: actionable.neuroplastic_type === 'integration' ? 'high' as const : 'medium' as const,
            neuroplasticity_day: (weekIndex * 7) + actionableIndex + 1,
            completion_status: 'pending' as const,
            completion_percentage: 0,
            ai_generated: true
          });
        });
      });

      // Lägg till dagliga micro-actions
      timelineData.daily_micro_actions.forEach((microAction, index) => {
        for (let day = 0; day < timelineData.timeline_duration; day += 3) { // Varje tredje dag
          const scheduleDate = new Date(startDate);
          scheduleDate.setDate(startDate.getDate() + day);

          newActionables.push({
            user_id: user.id,
            pillar_key: pillarKey,
            title: microAction.title,
            description: microAction.description,
            scheduled_date: scheduleDate.toISOString(),
            estimated_duration: 5,
            priority: 'low' as const,
            neuroplasticity_day: day + 1,
            completion_status: 'pending' as const,
            completion_percentage: 0,
            ai_generated: true
          });
        }
      });

      // Spara till databasen
      const { data: savedActionables, error: saveError } = await supabase
        .from('calendar_actionables')
        .insert(newActionables as any)
        .select();

      if (saveError) throw saveError;

      // Type safe update
      const typedSavedActionables: CalendarActionable[] = (savedActionables || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        title: item.title,
        description: item.description,
        scheduled_date: item.scheduled_date,
        estimated_duration: item.estimated_duration,
        priority: ['low', 'medium', 'high', 'critical'].includes(item.priority) 
          ? item.priority as CalendarActionable['priority']
          : 'medium',
        neuroplasticity_day: item.neuroplasticity_day,
        completion_status: ['pending', 'in_progress', 'completed', 'skipped'].includes(item.completion_status)
          ? item.completion_status as CalendarActionable['completion_status']
          : 'pending',
        completion_percentage: item.completion_percentage || 0,
        user_notes: item.user_notes,
        pillar_key: item.pillar_key,
        ai_generated: item.ai_generated || false
      }));

      setActionables(prev => [...prev, ...typedSavedActionables]);
      
      toast({
        title: "Utvecklingsplan skapad!",
        description: `${newActionables.length} actionables har lagts till i din kalender.`,
        variant: "default"
      });

    } catch (error) {
      console.error('Error generating actionables:', error);
      toast({
        title: "Fel",
        description: "Kunde inte generera utvecklingsplan.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Uppdatera actionable status
  const updateActionableStatus = async (
    actionableId: string, 
    status: CalendarActionable['completion_status'],
    percentage: number = 0,
    notes?: string
  ) => {
    try {
      const updateData: any = {
        completion_status: status,
        completion_percentage: percentage,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      if (notes) {
        updateData.user_notes = notes;
      }

      const { error } = await supabase
        .from('calendar_actionables')
        .update(updateData)
        .eq('id', actionableId);

      if (error) throw error;

      // Uppdatera lokal state
      setActionables(prev => 
        prev.map(actionable => 
          actionable.id === actionableId 
            ? { ...actionable, ...updateData }
            : actionable
        )
      );

      if (status === 'completed') {
        toast({
          title: "Bra jobbat! 🎉",
          description: "Du har slutfört en utvecklingsuppgift.",
          variant: "default"
        });
        onActionableComplete?.(actionableId);
      }

    } catch (error) {
      console.error('Error updating actionable:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera status.",
        variant: "destructive"
      });
    }
  };

  // Filtrera actionables för vald dag
  const getActionablesForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return actionables.filter(actionable => 
      actionable.scheduled_date.split('T')[0] === dateString
    );
  };

  // Få prioritetsfärg
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'low': return 'bg-gray-100 text-gray-700 border-gray-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  // Få status ikon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Play className="h-4 w-4 text-blue-500" />;
      case 'skipped': return <RotateCcw className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  useEffect(() => {
    loadActionables();
  }, [user, pillarKey]);

  const selectedDateActionables = getActionablesForDate(selectedDate);
  const todayActionables = getActionablesForDate(new Date());
  const completedToday = todayActionables.filter(a => a.completion_status === 'completed').length;
  const totalToday = todayActionables.length;

  return (
    <div className="space-y-6">
      {/* Header med statistik */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Utvecklingskalender</h2>
          <p className="text-muted-foreground">
            Din personliga neuroplastiska resa
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {totalToday > 0 && (
            <Badge variant="outline" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              {completedToday}/{totalToday} idag
            </Badge>
          )}
          
          {timelineData && !actionables.length && (
            <Button 
              onClick={generateActionablesFromTimeline}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              {isGenerating ? 'Genererar...' : 'Skapa utvecklingsplan'}
            </Button>
          )}
        </div>
      </div>

      {/* Progress för idag */}
      {totalToday > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Dagens framsteg</span>
              <span className="text-sm text-muted-foreground">
                {Math.round((completedToday / totalToday) * 100)}%
              </span>
            </div>
            <Progress value={(completedToday / totalToday) * 100} className="h-3" />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kalender */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Kalender
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{
                hasActionables: (date) => getActionablesForDate(date).length > 0,
                hasCompleted: (date) => getActionablesForDate(date).some(a => a.completion_status === 'completed')
              }}
              modifiersStyles={{
                hasActionables: { backgroundColor: 'hsl(var(--primary) / 0.1)' },
                hasCompleted: { backgroundColor: 'hsl(var(--primary))', color: 'white' }
              }}
            />
          </CardContent>
        </Card>

        {/* Actionables för vald dag */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedDate.toLocaleDateString('sv-SE', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Laddar...</p>
              </div>
            ) : selectedDateActionables.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Inga aktiviteter planerade</h3>
                <p className="text-sm text-muted-foreground">
                  Denna dag har inga utvecklingsaktiviteter schemalagda.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateActionables.map((actionable) => (
                  <div 
                    key={actionable.id}
                    className={`p-4 border rounded-lg ${getPriorityColor(actionable.priority)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(actionable.completion_status)}
                          <h4 className="font-medium">{actionable.title}</h4>
                          <Badge variant="outline">
                            {actionable.estimated_duration} min
                          </Badge>
                          {actionable.neuroplasticity_day && (
                            <Badge variant="secondary">
                              Dag {actionable.neuroplasticity_day}
                            </Badge>
                          )}
                        </div>
                        
                        {actionable.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {actionable.description}
                          </p>
                        )}

                        {actionable.completion_status === 'in_progress' && (
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Framsteg</span>
                              <span className="text-xs text-muted-foreground">
                                {actionable.completion_percentage}%
                              </span>
                            </div>
                            <Slider
                              value={[actionable.completion_percentage]}
                              onValueChange={(value) => 
                                updateActionableStatus(actionable.id, 'in_progress', value[0])
                              }
                              max={100}
                              step={10}
                              className="h-2"
                            />
                          </div>
                        )}

                        {actionable.user_notes && (
                          <div className="mt-2 p-2 bg-white/50 rounded text-xs">
                            <strong>Anteckningar:</strong> {actionable.user_notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      {actionable.completion_status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateActionableStatus(actionable.id, 'in_progress', 0)}
                            className="flex items-center gap-1"
                          >
                            <Play className="h-3 w-3" />
                            Starta
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateActionableStatus(actionable.id, 'completed', 100)}
                          >
                            Markera som klar
                          </Button>
                        </>
                      )}

                      {actionable.completion_status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => updateActionableStatus(actionable.id, 'completed', 100)}
                          className="flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Slutför
                        </Button>
                      )}

                      {actionable.completion_status !== 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateActionableStatus(actionable.id, 'skipped', 0)}
                        >
                          Hoppa över
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};