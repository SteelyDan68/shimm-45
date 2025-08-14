import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { 
  CalendarIcon, 
  Clock, 
  Save, 
  X, 
  Sparkles, 
  Target, 
  Calendar as CalendarIconLucide,
  CheckSquare,
  Users,
  Eye,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateUnifiedTaskEvent } from '@/hooks/useUnifiedCalendarTasks';

interface UnifiedTaskEventCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateUnifiedTaskEvent) => Promise<boolean>;
  clientId?: string;
  initialDate?: Date;
  isCoachView?: boolean;
}

const PILLAR_TYPES = [
  { value: 'self_care', label: 'Självomvårdnad', icon: '🧘', color: 'bg-green-100 text-green-800' },
  { value: 'skills', label: 'Skills', icon: '🎯', color: 'bg-blue-100 text-blue-800' },
  { value: 'talent', label: 'Talent', icon: '⭐', color: 'bg-purple-100 text-purple-800' },
  { value: 'brand', label: 'Brand', icon: '🏆', color: 'bg-orange-100 text-orange-800' },
  { value: 'economy', label: 'Economy', icon: '💰', color: 'bg-red-100 text-red-800' }
];

const CATEGORIES = [
  { value: 'meeting', label: 'Möte', icon: '👥' },
  { value: 'task', label: 'Uppgift', icon: '✅' },
  { value: 'deadline', label: 'Deadline', icon: '⏰' },
  { value: 'reminder', label: 'Påminnelse', icon: '🔔' },
  { value: 'learning', label: 'Lärande', icon: '📚' },
  { value: 'reflection', label: 'Reflektion', icon: '🤔' },
  { value: 'habit', label: 'Vana', icon: '🔄' },
  { value: 'goal', label: 'Mål', icon: '🎯' }
];

export const UnifiedTaskEventCreator = ({
  isOpen,
  onClose,
  onCreate,
  clientId,
  initialDate = new Date(),
  isCoachView = false
}: UnifiedTaskEventCreatorProps) => {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    date: Date;
    time: string;
    type: 'task' | 'event' | 'both';
    priority: 'low' | 'medium' | 'high';
    category: string;
    pillar_type: string;
    duration: number;
    ai_generated: boolean;
    visible_to_client: boolean;
  }>({
    title: '',
    description: '',
    date: initialDate,
    time: '09:00',
    type: 'both',
    priority: 'medium',
    category: '',
    pillar_type: '',
    duration: 60,
    ai_generated: false,
    visible_to_client: !isCoachView
  });

  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;

    setCreating(true);

    try {
      // Combine date and time
      const [hours, minutes] = formData.time.split(':').map(Number);
      const eventDate = new Date(formData.date);
      eventDate.setHours(hours, minutes, 0, 0);

      const createData: CreateUnifiedTaskEvent = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        date: eventDate,
        type: formData.type,
        priority: formData.priority,
        category: formData.category || undefined,
        pillar_type: formData.pillar_type || undefined,
        duration: formData.duration,
        ai_generated: formData.ai_generated,
        visible_to_client: formData.visible_to_client,
        created_by_role: isCoachView ? 'coach' : 'client'
      };

      const success = await onCreate(createData);
      
      if (success) {
        handleReset();
        onClose();
      }
    } catch (error) {
      console.error('Creation failed:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleReset = () => {
    setFormData({
      title: '',
      description: '',
      date: initialDate,
      time: '09:00',
      type: 'both',
      priority: 'medium',
      category: '',
      pillar_type: '',
      duration: 60,
      ai_generated: false,
      visible_to_client: !isCoachView
    });
  };

  const handleCancel = () => {
    handleReset();
    onClose();
  };

  const selectedPillar = PILLAR_TYPES.find(p => p.value === formData.pillar_type);
  const selectedCategory = CATEGORIES.find(c => c.value === formData.category);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Skapa Uppgift & Kalenderhändelse
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Vad vill du skapa?</label>
            <Tabs value={formData.type} onValueChange={(value: 'task' | 'event' | 'both') => 
              setFormData(prev => ({ ...prev, type: value }))
            }>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="task" className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Uppgift
                </TabsTrigger>
                <TabsTrigger value="event" className="flex items-center gap-2">
                  <CalendarIconLucide className="h-4 w-4" />
                  Händelse
                </TabsTrigger>
                <TabsTrigger value="both" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Båda
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Titel <span className="text-destructive">*</span>
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Morgonträning, Kundmöte, Reflektion..."
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Beskrivning
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detaljerad beskrivning av vad som ska göras..."
              rows={3}
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Datum</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, 'PP', { locale: sv }) : 'Välj datum'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label htmlFor="time" className="text-sm font-medium">Tid</label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>
          </div>

          {/* Pillar and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pillar-område</label>
              <Select 
                value={formData.pillar_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, pillar_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj pillar-område" />
                </SelectTrigger>
                <SelectContent>
                  {PILLAR_TYPES.map((pillar) => (
                    <SelectItem key={pillar.value} value={pillar.value}>
                      <div className="flex items-center gap-2">
                        <span>{pillar.icon}</span>
                        {pillar.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPillar && (
                <Badge className={selectedPillar.color}>
                  {selectedPillar.icon} {selectedPillar.label}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Kategori</label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj kategori" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        {category.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCategory && (
                <Badge variant="secondary">
                  {selectedCategory.icon} {selectedCategory.label}
                </Badge>
              )}
            </div>
          </div>

          {/* Priority and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Prioritet</label>
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
                  <SelectItem value="low">Låg prioritet</SelectItem>
                  <SelectItem value="medium">Medium prioritet</SelectItem>
                  <SelectItem value="high">Hög prioritet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Varaktighet (minuter)</label>
              <Select 
                value={formData.duration.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minuter</SelectItem>
                  <SelectItem value="30">30 minuter</SelectItem>
                  <SelectItem value="60">1 timme</SelectItem>
                  <SelectItem value="90">1.5 timme</SelectItem>
                  <SelectItem value="120">2 timmar</SelectItem>
                  <SelectItem value="240">4 timmar</SelectItem>
                  <SelectItem value="480">Heldag</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium text-sm">Inställningar</h4>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <label htmlFor="ai-generated" className="text-sm font-medium">
                  AI-genererad
                </label>
              </div>
              <Switch
                id="ai-generated"
                checked={formData.ai_generated}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ai_generated: checked }))}
              />
            </div>

            {isCoachView && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {formData.visible_to_client ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  <label htmlFor="visible-to-client" className="text-sm font-medium">
                    Synlig för klient
                  </label>
                </div>
                <Switch
                  id="visible-to-client"
                  checked={formData.visible_to_client}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, visible_to_client: checked }))}
                />
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-sm text-blue-900 mb-2">Förhandsvisning</h4>
            <div className="text-sm space-y-1 text-blue-800">
              <div><strong>Skapar:</strong> {
                formData.type === 'both' ? 'Både uppgift och kalenderhändelse' :
                formData.type === 'task' ? 'Uppgift' : 'Kalenderhändelse'
              }</div>
              <div><strong>Datum:</strong> {format(formData.date, 'PPPP', { locale: sv })} kl {formData.time}</div>
              {formData.pillar_type && <div><strong>Pillar:</strong> {selectedPillar?.label}</div>}
              {formData.category && <div><strong>Kategori:</strong> {selectedCategory?.label}</div>}
              <div><strong>Prioritet:</strong> {formData.priority === 'high' ? 'Hög' : formData.priority === 'low' ? 'Låg' : 'Medium'}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={creating || !formData.title.trim()}>
              {creating ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Skapar...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Skapa {formData.type === 'both' ? 'Båda' : formData.type === 'task' ? 'Uppgift' : 'Händelse'}
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={creating}>
              <X className="h-4 w-4 mr-2" />
              Avbryt
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};