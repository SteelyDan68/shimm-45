import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { 
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { 
  CSS 
} from '@dnd-kit/utilities';
import {
  Brain,
  Target,
  Calendar,
  CheckCircle2,
  Pause,
  Play,
  Settings,
  AlertCircle,
  GripVertical,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { CalendarScheduler } from './CalendarScheduler';
import { ActionableCalendarView } from '../Calendar/ActionableCalendarView';
import { LANGUAGE_16YO } from '@/config/language16yo';

interface ActionableItem {
  id: string;
  title: string;
  description?: string;
  pillar_key: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_duration: number;
  completion_status: 'pending' | 'in_progress' | 'completed' | 'paused';
  scheduled_date: string;
  ai_generated: boolean;
  neuroplasticity_day?: number;
}

interface PillarGroup {
  pillar_key: string;
  pillar_name: string;
  is_active: boolean;
  actionables: ActionableItem[];
  total_items: number;
  active_items: number;
}

interface SmartPriorityDashboardProps {
  userId: string;
}

const SortableActionableCard = ({ actionable, onToggleStatus, onToggleVisibility }: {
  actionable: ActionableItem & { is_visible: boolean; priority_order: number };
  onToggleStatus: (id: string, status: string) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: actionable.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-4 border-l-red-500 bg-red-50';
      case 'high': return 'border-l-4 border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-4 border-l-blue-500 bg-blue-50';
      case 'low': return 'border-l-4 border-l-gray-500 bg-gray-50';
      default: return 'border-l-4 border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityLabel = (priority: string) => {
    return LANGUAGE_16YO.actionables.priority[priority as keyof typeof LANGUAGE_16YO.actionables.priority] || priority;
  };

  const getStatusLabel = (status: string) => {
    return LANGUAGE_16YO.actionables.status[status as keyof typeof LANGUAGE_16YO.actionables.status] || status;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border p-4 ${getPriorityColor(actionable.priority)} ${!actionable.is_visible ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab hover:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{actionable.title}</h4>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleVisibility(actionable.id, !actionable.is_visible)}
              >
                {actionable.is_visible ? 
                  <Eye className="h-4 w-4" /> : 
                  <EyeOff className="h-4 w-4" />
                }
              </Button>
              <Badge variant="outline">
                {actionable.estimated_duration} min
              </Badge>
              {actionable.ai_generated && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI
                </Badge>
              )}
            </div>
          </div>
          
          {actionable.description && (
            <p className="text-sm text-muted-foreground">
              {actionable.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge 
                variant={actionable.completion_status === 'completed' ? 'default' : 'outline'}
                className={actionable.completion_status === 'completed' ? 'bg-green-100 text-green-700' : ''}
              >
                {getStatusLabel(actionable.completion_status)}
              </Badge>
              {actionable.neuroplasticity_day && (
                <Badge variant="outline" className="bg-brain-gradient text-white">
                  <Brain className="h-3 w-3 mr-1" />
                  Dag {actionable.neuroplasticity_day}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {actionable.completion_status === 'pending' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleStatus(actionable.id, 'in_progress')}
                >
                  <Play className="h-4 w-4" />
                </Button>
              )}
              {actionable.completion_status === 'in_progress' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleStatus(actionable.id, 'paused')}
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleStatus(actionable.id, 'completed')}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ActionablePriorityDashboard = ({ userId }: SmartPriorityDashboardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [pillarGroups, setPillarGroups] = useState<PillarGroup[]>([]);
  const [actionableItems, setActionableItems] = useState<(ActionableItem & { is_visible: boolean; priority_order: number })[]>([]);
  const [activeActionables, setActiveActionables] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [neuroplasticityLimit, setNeuroplasticityLimit] = useState(5);
  const [currentView, setCurrentView] = useState<'pillars' | 'priority' | 'timeline' | 'calendar'>('pillars');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Ladda pillar groups och actionables
  const loadDashboardData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Ladda actionables från calendar_actionables
      const { data: actionablesData, error: actionablesError } = await supabase
        .from('calendar_actionables')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (actionablesError) throw actionablesError;

      // Ladda användarens pillar preferences från user_attributes
      const { data: preferencesData, error: preferencesError } = await supabase
        .from('user_attributes')
        .select('*')
        .eq('user_id', userId)
        .eq('attribute_key', 'actionable_preferences');

      const preferences = preferencesData?.[0]?.attribute_value || {};

      // Gruppera actionables per pillar
      const pillarMap = new Map<string, ActionableItem[]>();
      const enhancedActionables: (ActionableItem & { is_visible: boolean; priority_order: number })[] = [];

      (actionablesData || []).forEach((item: any) => {
        const actionable: ActionableItem = {
          id: item.id,
          title: item.title,
          description: item.description,
          pillar_key: item.pillar_key,
          priority: item.priority || 'medium',
          estimated_duration: item.estimated_duration || 30,
          completion_status: item.completion_status || 'pending',
          scheduled_date: item.scheduled_date,
          ai_generated: item.ai_generated || false,
          neuroplasticity_day: item.neuroplasticity_day
        };

        const enhanced = {
          ...actionable,
          is_visible: preferences[item.id]?.is_visible !== false,
          priority_order: preferences[item.id]?.priority_order || 999
        };

        enhancedActionables.push(enhanced);

        if (!pillarMap.has(item.pillar_key)) {
          pillarMap.set(item.pillar_key, []);
        }
        pillarMap.get(item.pillar_key)!.push(actionable);
      });

      // Skapa pillar groups
      const groups: PillarGroup[] = Array.from(pillarMap.entries()).map(([pillarKey, actionables]) => ({
        pillar_key: pillarKey,
        pillar_name: pillarKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        is_active: preferences[`pillar_${pillarKey}`]?.is_active !== false,
        actionables,
        total_items: actionables.length,
        active_items: actionables.filter(a => a.completion_status !== 'completed').length
      }));

      // Sortera actionables enligt priority_order
      enhancedActionables.sort((a, b) => a.priority_order - b.priority_order);

      setPillarGroups(groups);
      setActionableItems(enhancedActionables);

      // Bestäm aktiva actionables (neuroplasticity timeline)
      const visibleActionables = enhancedActionables.filter(a => a.is_visible && a.completion_status !== 'completed');
      setActiveActionables(visibleActionables.slice(0, neuroplasticityLimit).map(a => a.id));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda din prioritetsöversikt.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Spara preferences
  const savePreferences = async (newPreferences: any) => {
    try {
      await supabase
        .from('user_attributes')
        .upsert({
          user_id: userId,
          attribute_key: 'actionable_preferences',
          attribute_value: newPreferences,
          attribute_type: 'preference'
        });
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  // Toggle pillar aktivering
  const togglePillarActive = async (pillarKey: string, isActive: boolean) => {
    try {
      const currentPrefs = await getCurrentPreferences();
      const newPrefs: Record<string, any> = {
        ...(currentPrefs || {}),
        [`pillar_${pillarKey}`]: { is_active: isActive }
      };
      await savePreferences(newPrefs);
      await loadDashboardData();
      
      toast({
        title: isActive ? "Pelare aktiverad" : "Pelare inaktiverad",
        description: `${pillarKey.replace('_', ' ')} är nu ${isActive ? 'aktiverad' : 'inaktiverad'}.`,
      });
    } catch (error) {
      console.error('Error toggling pillar:', error);
    }
  };

  const getCurrentPreferences = async (): Promise<Record<string, any>> => {
    const { data } = await supabase
      .from('user_attributes')
      .select('attribute_value')
      .eq('user_id', userId)
      .eq('attribute_key', 'actionable_preferences')
      .maybeSingle();
    
    const value = data?.attribute_value;
    return (typeof value === 'object' && value !== null && !Array.isArray(value)) ? value : {};
  };

  // Toggle actionable synlighet
  const toggleActionableVisibility = async (actionableId: string, isVisible: boolean) => {
    try {
      const currentPrefs = await getCurrentPreferences();
      const newPrefs: Record<string, any> = {
        ...(currentPrefs || {}),
        [actionableId]: { 
          ...((currentPrefs as any)?.[actionableId] || {}), 
          is_visible: isVisible 
        }
      };
      await savePreferences(newPrefs);
      await loadDashboardData();
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  // Uppdatera actionable status
  const updateActionableStatus = async (actionableId: string, status: string) => {
    try {
      await supabase
        .from('calendar_actionables')
        .update({ 
          completion_status: status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', actionableId);

      await loadDashboardData();
      
      if (status === 'completed') {
        toast({
          title: "Bra jobbat! 🎉",
          description: "Du har slutfört en utvecklingsuppgift.",
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Drag and drop hantering
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = actionableItems.findIndex(item => item.id === active.id);
    const newIndex = actionableItems.findIndex(item => item.id === over.id);

    const newOrder = arrayMove(actionableItems, oldIndex, newIndex);
    setActionableItems(newOrder);

      // Spara ny ordning
      try {
        const currentPrefs = await getCurrentPreferences();
        const newPrefs: Record<string, any> = { ...(currentPrefs || {}) };
        
        newOrder.forEach((item, index) => {
          newPrefs[item.id] = { 
            ...(newPrefs[item.id] || {}), 
            priority_order: index 
          };
        });

        await savePreferences(newPrefs);
      } catch (error) {
        console.error('Error saving order:', error);
      }
  };


  useEffect(() => {
    loadDashboardData();
  }, [user, userId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Laddar din prioritetsöversikt...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeCount = activeActionables.length;
  const totalVisible = actionableItems.filter(a => a.is_visible).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            {LANGUAGE_16YO.actionables.title}
          </h2>
          <p className="text-muted-foreground">
            Stefan hjälper dig hålla koll på vad som behöver göras 🧠✨
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            {activeCount}/{neuroplasticityLimit} aktiva
          </Badge>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Neuroplasticity Limit:</label>
            <select
              value={neuroplasticityLimit}
              onChange={(e) => setNeuroplasticityLimit(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={3}>3 åt gången</option>
              <option value={5}>5 åt gången</option>
              <option value={7}>7 åt gången</option>
            </select>
          </div>
        </div>
      </div>

      {/* Smart Timeline Alert */}
      {activeCount > neuroplasticityLimit && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Du har {activeCount} aktiva saker, men Stefan vet att max {neuroplasticityLimit} saker samtidigt 
            fungerar bäst för din hjärna! 🧠 Pausa några för att få bättre resultat ✨
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs för olika vyer */}
      <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as any)}>
        <TabsList>
          <TabsTrigger value="pillars">📂 Mina områden</TabsTrigger>
          <TabsTrigger value="priority">🎯 Viktighet</TabsTrigger>
          <TabsTrigger value="calendar">📅 Planera in</TabsTrigger>
          <TabsTrigger value="timeline">🧠 Smart ordning</TabsTrigger>
        </TabsList>

        {/* Pillar View */}
        <TabsContent value="pillars" className="space-y-4">
          {pillarGroups.map((pillar) => (
            <Card key={pillar.pillar_key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {pillar.pillar_name}
                    <Badge variant="outline">
                      {pillar.active_items}/{pillar.total_items}
                    </Badge>
                  </CardTitle>
                  <Switch
                    checked={pillar.is_active}
                    onCheckedChange={(checked) => togglePillarActive(pillar.pillar_key, checked)}
                  />
                </div>
                <Progress 
                  value={pillar.total_items > 0 ? ((pillar.total_items - pillar.active_items) / pillar.total_items) * 100 : 0} 
                  className="h-2"
                />
              </CardHeader>
              {pillar.is_active && (
                <CardContent>
                  <div className="space-y-3">
                    {pillar.actionables.slice(0, 5).map((actionable) => {
                      const enhanced = actionableItems.find(a => a.id === actionable.id);
                      if (!enhanced) return null;
                      
                      return (
                        <SortableActionableCard
                          key={actionable.id}
                          actionable={enhanced}
                          onToggleStatus={updateActionableStatus}
                          onToggleVisibility={toggleActionableVisibility}
                        />
                      );
                    })}
                    {pillar.actionables.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{pillar.actionables.length - 5} fler actionables...
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        {/* Priority View */}
        <TabsContent value="priority">
          <Card>
            <CardHeader>
              <CardTitle>Drag & Drop Prioritering</CardTitle>
              <p className="text-muted-foreground">
                Dra och släpp för att ändra ordning. Högst upp = högsta prioritet.
              </p>
            </CardHeader>
            <CardContent>
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={actionableItems.map(a => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {actionableItems.map((actionable) => (
                      <SortableActionableCard
                        key={actionable.id}
                        actionable={actionable}
                        onToggleStatus={updateActionableStatus}
                        onToggleVisibility={toggleActionableVisibility}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Scheduling View */}
        <TabsContent value="calendar" className="space-y-6">
          <CalendarScheduler
            actionables={actionableItems}
            userId={userId}
            onScheduled={loadDashboardData}
          />
          
          {/* Show scheduled actionables in calendar */}
          <div className="pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Inplanerade saker
            </h3>
            <ActionableCalendarView userId={userId} />
          </div>
        </TabsContent>

        {/* Timeline View */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Smart planering för din hjärna
              </CardTitle>
              <p className="text-muted-foreground">
                Stefan vet hur din hjärna fungerar bäst - max {neuroplasticityLimit} saker samtidigt ger bästa resultat! 🧠✨
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Aktiva actionables */}
                <div>
                  <h4 className="font-medium mb-3 text-green-700">🧠 Aktiva nu ({activeActionables.length})</h4>
                  <div className="space-y-3">
                    {actionableItems
                      .filter(a => activeActionables.includes(a.id))
                      .map((actionable) => (
                        <SortableActionableCard
                          key={actionable.id}
                          actionable={actionable}
                          onToggleStatus={updateActionableStatus}
                          onToggleVisibility={toggleActionableVisibility}
                        />
                      ))}
                  </div>
                </div>

                {/* Kommande actionables */}
                <div>
                  <h4 className="font-medium mb-3 text-blue-700">⏳ Kommande</h4>
                  <div className="space-y-3">
                    {actionableItems
                      .filter(a => a.is_visible && !activeActionables.includes(a.id) && a.completion_status !== 'completed')
                      .slice(0, 10)
                      .map((actionable) => (
                        <SortableActionableCard
                          key={actionable.id}
                          actionable={actionable}
                          onToggleStatus={updateActionableStatus}
                          onToggleVisibility={toggleActionableVisibility}
                        />
                      ))}
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