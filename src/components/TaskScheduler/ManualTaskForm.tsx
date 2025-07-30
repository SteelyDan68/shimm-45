import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { TaskPriority, CreateTaskData } from '@/types/tasks';

interface ManualTaskFormProps {
  clientId: string;
  onCreateTask: (taskData: CreateTaskData) => Promise<void>;
}

export function ManualTaskForm({ clientId, onCreateTask }: ManualTaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    deadline: undefined as Date | undefined
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateTask({
        client_id: clientId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        deadline: formData.deadline?.toISOString(),
        ai_generated: false
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        deadline: undefined
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating manual task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Lägg till manuell uppgift
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isOpen ? (
          <Button onClick={() => setIsOpen(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Skapa ny uppgift
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Vad ska klienten göra?"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Beskrivning (valfritt)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mer detaljerad information om uppgiften..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Prioritet</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value: TaskPriority) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md">
                    <SelectItem value="low">Låg</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">Hög</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="deadline">Deadline (valfritt)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.deadline && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.deadline ? (
                        format(formData.deadline, "PPP", { locale: sv })
                      ) : (
                        <span>Välj datum</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background border shadow-md" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.deadline}
                      onSelect={(date) => setFormData(prev => ({ ...prev, deadline: date }))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
              >
                Avbryt
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !formData.title.trim()}
              >
                {isSubmitting ? 'Skapar...' : 'Skapa uppgift'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}