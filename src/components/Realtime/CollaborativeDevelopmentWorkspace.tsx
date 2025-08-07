/**
 * 🤝 COLLABORATIVE DEVELOPMENT WORKSPACE
 * Real-time samarbete för utvecklingsplanering och målsättning
 * Phase 4: Real-time Experience Revolution
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Target, 
  Plus, 
  Edit3, 
  Check, 
  X, 
  MessageSquare,
  Clock,
  Star,
  Lightbulb,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface CollaborativeGoal {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'active' | 'completed' | 'paused';
  assignedTo: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  tags: string[];
  comments: CollaborativeComment[];
  isBeingEdited: boolean;
  editedBy?: string;
}

interface CollaborativeComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  type: 'comment' | 'suggestion' | 'update';
}

interface ActiveCollaborator {
  userId: string;
  userName: string;
  avatar?: string;
  role: 'coach' | 'client';
  status: 'online' | 'away' | 'busy';
  lastActivity: Date;
  currentGoal?: string; // ID of goal being edited
}

interface CollaborativeDevelopmentWorkspaceProps {
  workspaceId?: string;
  userId?: string;
  className?: string;
}

export const CollaborativeDevelopmentWorkspace: React.FC<CollaborativeDevelopmentWorkspaceProps> = ({
  workspaceId = 'default',
  userId,
  className = ""
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const effectiveUserId = userId || user?.id;
  
  const [goals, setGoals] = useState<CollaborativeGoal[]>([]);
  const [collaborators, setCollaborators] = useState<ActiveCollaborator[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  
  const realtimeChannelRef = useRef<any>(null);
  const lastActivityRef = useRef<Date>(new Date());

  // 🔄 REAL-TIME COLLABORATION SETUP
  useEffect(() => {
    if (!effectiveUserId) return;

    const channel = supabase
      .channel(`workspace-${workspaceId}`)
      .on('broadcast',
        { event: 'goal_update' },
        (payload) => {
          setGoals(prev => {
            const existingIndex = prev.findIndex(g => g.id === payload.goal.id);
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = { ...payload.goal, updatedAt: new Date(payload.goal.updatedAt) };
              return updated;
            } else {
              return [...prev, { ...payload.goal, updatedAt: new Date(payload.goal.updatedAt) }];
            }
          });
        }
      )
      .on('broadcast',
        { event: 'goal_delete' },
        (payload) => {
          setGoals(prev => prev.filter(g => g.id !== payload.goalId));
        }
      )
      .on('broadcast',
        { event: 'collaborator_update' },
        (payload) => {
          setCollaborators(prev => {
            const existingIndex = prev.findIndex(c => c.userId === payload.collaborator.userId);
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = payload.collaborator;
              return updated;
            } else {
              return [...prev, payload.collaborator];
            }
          });
        }
      )
      .on('broadcast',
        { event: 'goal_edit_start' },
        (payload) => {
          setGoals(prev => prev.map(g => 
            g.id === payload.goalId 
              ? { ...g, isBeingEdited: true, editedBy: payload.userId }
              : g
          ));
        }
      )
      .on('broadcast',
        { event: 'goal_edit_end' },
        (payload) => {
          setGoals(prev => prev.map(g => 
            g.id === payload.goalId 
              ? { ...g, isBeingEdited: false, editedBy: undefined }
              : g
          ));
        }
      )
      .on('broadcast',
        { event: 'comment_added' },
        (payload) => {
          setGoals(prev => prev.map(g => 
            g.id === payload.goalId 
              ? { 
                  ...g, 
                  comments: [...g.comments, {
                    ...payload.comment,
                    timestamp: new Date(payload.comment.timestamp)
                  }]
                }
              : g
          ));
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;

    // Announce presence
    broadcastCollaboratorUpdate('online');

    // Heartbeat to maintain presence
    const heartbeat = setInterval(() => {
      broadcastCollaboratorUpdate('online');
    }, 30000);

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
      clearInterval(heartbeat);
    };
  }, [workspaceId, effectiveUserId]);

  const broadcastCollaboratorUpdate = useCallback((status: 'online' | 'away' | 'busy') => {
    if (realtimeChannelRef.current && effectiveUserId) {
      const collaborator: ActiveCollaborator = {
        userId: effectiveUserId,
        userName: user?.email || 'Unknown User',
        avatar: user?.user_metadata?.avatar_url,
        role: 'client', // Could be determined from user roles
        status,
        lastActivity: new Date(),
        currentGoal: editingGoal || undefined
      };

      realtimeChannelRef.current.send({
        type: 'broadcast',
        event: 'collaborator_update',
        payload: { collaborator }
      });
    }
  }, [effectiveUserId, user?.email, user?.user_metadata?.avatar_url, editingGoal]);

  const createGoal = useCallback(() => {
    if (!newGoalTitle.trim()) return;

    const newGoal: CollaborativeGoal = {
      id: crypto.randomUUID(),
      title: newGoalTitle.trim(),
      description: newGoalDescription.trim(),
      priority: selectedPriority,
      status: 'draft',
      assignedTo: [effectiveUserId || ''],
      createdBy: effectiveUserId || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      comments: [],
      isBeingEdited: false
    };

    setGoals(prev => [...prev, newGoal]);
    setNewGoalTitle('');
    setNewGoalDescription('');

    // Broadcast the new goal
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.send({
        type: 'broadcast',
        event: 'goal_update',
        payload: { goal: newGoal }
      });
    }

    toast({
      title: "Mål skapat",
      description: "Ditt nya utvecklingsmål har lagts till."
    });
  }, [newGoalTitle, newGoalDescription, selectedPriority, effectiveUserId, toast]);

  const startEditing = useCallback((goalId: string) => {
    setEditingGoal(goalId);
    
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.send({
        type: 'broadcast',
        event: 'goal_edit_start',
        payload: { goalId, userId: effectiveUserId }
      });
    }
    
    broadcastCollaboratorUpdate('busy');
  }, [effectiveUserId, broadcastCollaboratorUpdate]);

  const stopEditing = useCallback(() => {
    const goalId = editingGoal;
    setEditingGoal(null);
    
    if (realtimeChannelRef.current && goalId) {
      realtimeChannelRef.current.send({
        type: 'broadcast',
        event: 'goal_edit_end',
        payload: { goalId }
      });
    }
    
    broadcastCollaboratorUpdate('online');
  }, [editingGoal, broadcastCollaboratorUpdate]);

  const updateGoalStatus = useCallback((goalId: string, newStatus: CollaborativeGoal['status']) => {
    setGoals(prev => prev.map(g => 
      g.id === goalId 
        ? { ...g, status: newStatus, updatedAt: new Date() }
        : g
    ));

    const updatedGoal = goals.find(g => g.id === goalId);
    if (updatedGoal && realtimeChannelRef.current) {
      realtimeChannelRef.current.send({
        type: 'broadcast',
        event: 'goal_update',
        payload: { 
          goal: { 
            ...updatedGoal, 
            status: newStatus, 
            updatedAt: new Date() 
          }
        }
      });
    }
  }, [goals]);

  const addComment = useCallback((goalId: string, content: string, type: 'comment' | 'suggestion' = 'comment') => {
    const comment: CollaborativeComment = {
      id: crypto.randomUUID(),
      userId: effectiveUserId || '',
      userName: user?.email || 'Unknown User',
      content,
      timestamp: new Date(),
      type
    };

    setGoals(prev => prev.map(g => 
      g.id === goalId 
        ? { ...g, comments: [...g.comments, comment] }
        : g
    ));

    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.send({
        type: 'broadcast',
        event: 'comment_added',
        payload: { goalId, comment }
      });
    }
  }, [effectiveUserId, user?.email]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-blue-500';
      case 'paused': return 'bg-gray-500';
      default: return 'bg-gray-300';
    }
  };

  const filteredGoals = goals.filter(goal => 
    showCompleted ? true : goal.status !== 'completed'
  );

  const activeCollaborators = collaborators.filter(c => 
    c.status === 'online' || c.status === 'busy'
  );

  // Initialize with some demo data
  useEffect(() => {
    if (goals.length === 0) {
      setGoals([
        {
          id: 'demo-goal-1',
          title: 'Förbättra kommunikationsförmåga',
          description: 'Utveckla förmågan att kommunicera tydligt och engagerande i professionella sammanhang.',
          priority: 'high',
          status: 'active',
          assignedTo: [effectiveUserId || ''],
          createdBy: effectiveUserId || '',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['kommunikation', 'soft skills'],
          comments: [
            {
              id: 'comment-1',
              userId: 'coach-1',
              userName: 'Stefan (Coach)',
              content: 'Detta är ett viktigt utvecklingsområde. Låt oss börja med aktiv lyssning.',
              timestamp: new Date(Date.now() - 1000 * 60 * 30),
              type: 'suggestion'
            }
          ],
          isBeingEdited: false
        }
      ]);
    }
  }, [goals.length, effectiveUserId]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Collaborative Development Workspace
              </CardTitle>
              <CardDescription>
                Samarbeta i realtid för att planera och följa upp utvecklingsmål
              </CardDescription>
            </div>
            
            {/* Active Collaborators */}
            <div className="flex items-center gap-2">
              {activeCollaborators.map((collaborator) => (
                <div key={collaborator.userId} className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={collaborator.avatar} />
                    <AvatarFallback className="text-xs">
                      {collaborator.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
                    collaborator.status === 'online' && "bg-green-500",
                    collaborator.status === 'busy' && "bg-yellow-500",
                    collaborator.status === 'away' && "bg-gray-500"
                  )} />
                </div>
              ))}
              <span className="text-xs text-muted-foreground ml-2">
                {activeCollaborators.length} online
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Goal Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Skapa nytt utvecklingsmål
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Måltitel..."
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                className="mb-2"
              />
              <Textarea
                placeholder="Beskrivning av målet..."
                value={newGoalDescription}
                onChange={(e) => setNewGoalDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prioritet</label>
              <div className="flex flex-wrap gap-2">
                {(['low', 'medium', 'high', 'urgent'] as const).map((priority) => (
                  <Button
                    key={priority}
                    variant={selectedPriority === priority ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPriority(priority)}
                    className="text-xs"
                  >
                    <div className={cn("w-2 h-2 rounded-full mr-2", getPriorityColor(priority))} />
                    {priority}
                  </Button>
                ))}
              </div>
              <Button onClick={createGoal} className="w-full" disabled={!newGoalTitle.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Skapa mål
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Utvecklingsmål ({filteredGoals.length})</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            {showCompleted ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showCompleted ? 'Dölj' : 'Visa'} slutförda
          </Button>
        </div>

        {filteredGoals.map((goal) => {
          const isEditedByOther = goal.isBeingEdited && goal.editedBy !== effectiveUserId;
          const editorName = isEditedByOther 
            ? collaborators.find(c => c.userId === goal.editedBy)?.userName 
            : null;

          return (
            <Card key={goal.id} className={cn(
              "transition-all duration-200",
              isEditedByOther && "ring-2 ring-yellow-500 ring-opacity-50"
            )}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <div className={cn("w-3 h-3 rounded-full", getPriorityColor(goal.priority))} />
                      <Badge variant="outline" className={cn("text-xs", getStatusColor(goal.status))}>
                        {goal.status}
                      </Badge>
                      {isEditedByOther && (
                        <Badge variant="secondary" className="text-xs">
                          <Edit3 className="h-3 w-3 mr-1" />
                          Redigeras av {editorName}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{goal.description}</CardDescription>
                    
                    {goal.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {goal.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {goal.status !== 'completed' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateGoalStatus(goal.id, 'completed')}
                          disabled={isEditedByOther}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(goal.id)}
                          disabled={isEditedByOther || editingGoal === goal.id}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground flex items-center gap-4">
                  <span>Skapad {goal.createdAt.toLocaleDateString('sv-SE')}</span>
                  <span>Uppdaterad {goal.updatedAt.toLocaleDateString('sv-SE')}</span>
                  <span>{goal.comments.length} kommentarer</span>
                </div>
              </CardHeader>

              {/* Comments */}
              {goal.comments.length > 0 && (
                <CardContent className="pt-0">
                  <div className="space-y-3 bg-muted/30 rounded-lg p-3">
                    <h5 className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Kommentarer & Förslag
                    </h5>
                    {goal.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 text-sm">
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          <AvatarFallback className="text-xs">
                            {comment.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{comment.userName}</span>
                            <Badge variant="outline" className="text-xs">
                              {comment.type === 'suggestion' ? <Lightbulb className="h-3 w-3 mr-1" /> : <MessageSquare className="h-3 w-3 mr-1" />}
                              {comment.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {comment.timestamp.toLocaleString('sv-SE')}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add Comment */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Input
                        placeholder="Lägg till en kommentar..."
                        className="text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const target = e.target as HTMLInputElement;
                            if (target.value.trim()) {
                              addComment(goal.id, target.value.trim());
                              target.value = '';
                            }
                          }
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const input = document.querySelector(`input[placeholder="Lägg till en kommentar..."]`) as HTMLInputElement;
                          if (input?.value.trim()) {
                            addComment(goal.id, input.value.trim(), 'suggestion');
                            input.value = '';
                          }
                        }}
                      >
                        <Lightbulb className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}

        {filteredGoals.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Inga utvecklingsmål ännu</h3>
              <p className="text-muted-foreground">
                Skapa ditt första utvecklingsmål för att komma igång med samarbetet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};