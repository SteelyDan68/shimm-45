import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Target, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Star,
  Brain,
  Plus,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/productionLogger';

interface ActionableItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category?: string;
  estimated_time?: number;
  estimated_duration: number;
  difficulty_level?: number;
  ai_generated: boolean;
  completion_status: 'pending' | 'in_progress' | 'completed' | 'deferred';
  scheduled_date: string | null;
  scheduled_time?: string | null;
  user_id: string;
  created_at: string;
  // Extra properties from database
  ai_recommendation_id?: string;
  completed_at?: string;
  completion_percentage?: number;
  due_date?: string;
  impact_score?: number;
  metadata?: any;
  recurring_pattern?: string;
  tags?: string[];
  updated_at?: string;
  user_notes?: string;
}

interface ActionablePriorityDashboardProps {
  userId: string;
  planId?: string;
}

export const ActionablePriorityDashboard: React.FC<ActionablePriorityDashboardProps> = ({
  userId,
  planId
}) => {
  const [actionables, setActionables] = useState<ActionableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedActionable, setSelectedActionable] = useState<ActionableItem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadActionables();
  }, [userId, planId]);

  const loadActionables = async () => {
    try {
      let query = supabase
        .from('calendar_actionables')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (planId) {
        query = query.eq('plan_id', planId);
      }
      const { data, error } = await query;

      if (error) throw error;
      setActionables((data || []) as ActionableItem[]);
    } catch (error) {
      logger.error('Error loading actionables', error as Error, { userId, planId });
      toast({
        title: "Fel vid laddning",
        description: "Kunde inte ladda dina actionables",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const scheduleActionable = async (actionableId: string, date: Date, time?: string) => {
    try {
      const { error } = await supabase
        .from('calendar_actionables')
        .update({
          scheduled_date: date.toISOString().split('T')[0],
          scheduled_time: time || null,
          completion_status: 'pending'
        })
        .eq('id', actionableId);

      if (error) throw error;

      await loadActionables();
      
      toast({
        title: "✅ Schemalagd!",
        description: `Uppgift schemalagd för ${format(date, 'dd MMM yyyy')}${time ? ` kl ${time}` : ''}`,
      });
    } catch (error) {
      logger.error('Error scheduling actionable', error as Error, { actionableId, date: date.toISOString(), time });
      toast({
        title: "Fel vid schemaläggning",
        description: "Kunde inte schemalägga uppgiften",
        variant: "destructive",
      });
    }
  };

  const updatePriority = async (actionableId: string, newPriority: 'high' | 'medium' | 'low') => {
    try {
      const { error } = await supabase
        .from('calendar_actionables')
        .update({ priority: newPriority })
        .eq('id', actionableId);

      if (error) throw error;
      await loadActionables();
      
      toast({
        title: "🎯 Prioritet uppdaterad",
        description: `Uppgift markerad som ${newPriority === 'high' ? 'hög' : newPriority === 'medium' ? 'medium' : 'låg'} prioritet`,
      });
    } catch (error) {
      logger.error('Error updating priority', error as Error, { actionableId, newPriority });
    }
  };

  const triggerAICoaching = async () => {
    toast({
      title: "🧠 AI-Coaching startar...",
      description: "Analyserar och prioriterar dina uppgifter baserat på assessment-svar",
    });

    try {
      // Hämta användarens assessment-data för smart prioritering
      const { data: assessments } = await supabase
        .from('assessment_rounds')
        .select('pillar_type, scores, answers')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Anropa AI för intelligent omprioritering baserat på assessment-svar
      const { data: aiResult, error } = await supabase.functions.invoke('enhance-ai-planning', {
        body: {
          user_id: userId,
          assessment_data: assessments || [],
          current_actionables: actionables,
          optimization_type: 'priority_rebalancing'
        }
      });

      if (error) throw error;

      if (aiResult?.updated_priorities) {
        // Uppdatera prioriteringar baserat på AI-analys
        for (const update of aiResult.updated_priorities) {
          await supabase
            .from('calendar_actionables')
            .update({ priority: update.new_priority })
            .eq('id', update.actionable_id);
        }

        await loadActionables();
        
        toast({
          title: "✨ AI-Coaching slutförd!",
          description: `${aiResult.updated_priorities.length} uppgifter omprioriterade baserat på dina assessment-svar. Resultatet visas nu i din prioriteringslista.`,
          duration: 6000
        });
      } else {
        toast({
          title: "✅ AI-Analys klar",
          description: "Dina prioriteringar är redan optimala baserat på dina assessment-svar",
        });
      }
    } catch (error) {
      console.error('AI coaching error:', error);
      toast({
        title: "⚠️ AI-Coaching misslyckades",
        description: "Kunde inte koppla till AI-tjänsten. Prioriteringarna behåller nuvarande ordning.",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50 text-red-700';
      case 'medium': return 'border-yellow-200 bg-yellow-50 text-yellow-700';
      case 'low': return 'border-green-200 bg-green-50 text-green-700';
      default: return 'border-gray-200 bg-gray-50 text-gray-700';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const groupedActionables = {
    high: actionables.filter(a => String(a.priority) === 'high'),
    medium: actionables.filter(a => String(a.priority) === 'medium'),
    low: actionables.filter(a => String(a.priority) === 'low')
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 animate-pulse text-blue-600" />
          <p>Laddar dina prioriteringar...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header med AI-coaching knapp */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Prioritering & Schemaläggning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={triggerAICoaching}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Brain className="h-4 w-4" />
              Förbättra planen med AI-coaching
              <Sparkles className="h-4 w-4" />
            </Button>
            <div className="text-sm text-muted-foreground flex-1">
              AI:n analyserar dina uppgifter och föreslår optimal prioritering baserat på neuroplastiska principer för maximal utveckling
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prioritetsgrupper */}
      {Object.entries(groupedActionables).map(([priority, items]) => (
        <Card key={priority}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getPriorityIcon(priority)}
              {priority === 'high' ? 'Hög Prioritet' : priority === 'medium' ? 'Medium Prioritet' : 'Låg Prioritet'}
              <Badge variant="outline">{items.length} uppgifter</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Inga uppgifter med {priority === 'high' ? 'hög' : priority === 'medium' ? 'medium' : 'låg'} prioritet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((actionable) => (
                  <Card key={actionable.id} className={`border-l-4 ${getPriorityColor(actionable.priority)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{actionable.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{actionable.description}</p>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline">{actionable.estimated_time || actionable.estimated_duration} min</Badge>
                            <Badge variant="outline">Svårighet: {actionable.difficulty_level || 3}/5</Badge>
                            {actionable.ai_generated && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                <Brain className="h-3 w-3 mr-1" />
                                AI-genererad
                              </Badge>
                            )}
                          </div>

                          {actionable.scheduled_date && (
                            <div className="flex items-center gap-1 text-xs text-blue-600 mt-2">
                              <CalendarIcon className="h-3 w-3" />
                              <span>
                                Schemalagd: {format(new Date(actionable.scheduled_date), 'dd MMM yyyy')}
                                {actionable.scheduled_time && ` kl ${actionable.scheduled_time}`}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          {/* Lägg till i kalender knapp */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="flex items-center gap-1">
                                <Plus className="h-3 w-3" />
                                <CalendarIcon className="h-3 w-3" />
                                Lägg till i kalender
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                              <div className="p-4 space-y-4">
                                <h4 className="font-semibold text-sm">Välj datum och tid</h4>
                                
                                <Calendar
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={setSelectedDate}
                                  initialFocus
                                  className="pointer-events-auto"
                                />
                                
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Tid (valfritt)</label>
                                  <input
                                    type="time"
                                    className="w-full px-3 py-2 border rounded-md text-sm"
                                    onChange={(e) => {
                                      if (selectedDate) {
                                        scheduleActionable(actionable.id, selectedDate, e.target.value);
                                      }
                                    }}
                                  />
                                </div>
                                
                                <Button 
                                  onClick={() => {
                                    if (selectedDate) {
                                      scheduleActionable(actionable.id, selectedDate);
                                    }
                                  }}
                                  className="w-full"
                                  size="sm"
                                  disabled={!selectedDate}
                                >
                                  Schemalägga
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>

                          {/* Prioritet selector */}
                          <select
                            value={actionable.priority}
                            onChange={(e) => updatePriority(actionable.id, e.target.value as any)}
                            className="text-xs border rounded px-2 py-1"
                          >
                            <option value="high">Hög</option>
                            <option value="medium">Medium</option>
                            <option value="low">Låg</option>
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Stats sammanfattning */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-600">{groupedActionables.high.length}</div>
              <div className="text-sm text-muted-foreground">Hög prioritet</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{groupedActionables.medium.length}</div>
              <div className="text-sm text-muted-foreground">Medium prioritet</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{groupedActionables.low.length}</div>
              <div className="text-sm text-muted-foreground">Låg prioritet</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {actionables.filter(a => a.scheduled_date).length}
              </div>
              <div className="text-sm text-muted-foreground">Schemalagda</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};