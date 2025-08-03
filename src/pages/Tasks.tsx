import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, User, Plus, CheckSquare, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { LiveTaskList } from '@/components/Tasks/LiveTaskList';

export function TasksPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { createTask, loading } = useTasks();
  const { user } = useAuth();
  
  const action = searchParams.get('action');
  const isCreating = action === 'create';
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    deadline: undefined as Date | undefined,
    assignedTo: '',
    category: 'coaching' as string
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Validering misslyckades",
        description: "Titel krävs för uppgiften",
        variant: "destructive"
      });
      return;
    }

    try {
      await createTask({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        deadline: formData.deadline?.toISOString(),
        user_id: formData.assignedTo || user?.id || '',
        ai_generated: false
      });

      toast({
        title: "Uppgift skapad",
        description: "Uppgiften har tilldelats framgångsrikt",
      });

      navigate('/coach');
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa uppgiften",
        variant: "destructive"
      });
    }
  };

  if (isCreating) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/coach')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka till Coach
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Skapa ny uppgift</h1>
            <p className="text-muted-foreground">Tilldela uppgifter till klienter för utveckling</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Ny uppgift
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Beskriv uppgiften kortfattat..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beskrivning</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detaljerad beskrivning av uppgiften och förväntade resultat..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prioritet</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value: 'low' | 'medium' | 'high') => 
                      setFormData(prev => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Låg prioritet
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          Medium prioritet
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          Hög prioritet
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.deadline ? (
                          format(formData.deadline, 'PPP', { locale: sv })
                        ) : (
                          <span>Välj datum</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.deadline}
                        onSelect={(date) => setFormData(prev => ({ ...prev, deadline: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo">Tilldela till klient (valfritt)</Label>
                <Input
                  id="assignedTo"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                  placeholder="Klient-ID eller e-post (lämna tomt för dig själv)"
                />
                <p className="text-xs text-muted-foreground">
                  Om tomt tilldelas uppgiften till dig som coach
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Skapar...' : 'Skapa uppgift'}
                  <CheckSquare className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/coach')}
                >
                  Avbryt
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default tasks overview page
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CheckSquare className="w-8 h-8 text-primary" />
            Uppgifter
          </h1>
          <p className="text-muted-foreground">
            Dina personliga utvecklingsuppgifter och AI-genererade rekommendationer
          </p>
        </div>
        <Button onClick={() => navigate('/tasks?action=create')}>
          <Plus className="mr-2 h-4 w-4" />
          Skapa uppgift
        </Button>
      </div>

      <LiveTaskList />
    </div>
  );
}