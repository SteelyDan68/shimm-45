import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { CalendarIcon, Save, X } from 'lucide-react';
import { CalendarEventData } from './CalendarModule';
import { cn } from '@/lib/utils';

interface AddEventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (eventData: Partial<CalendarEventData>) => void;
  clientId?: string;
  initialDate?: Date;
  onSuccess?: () => void;
}

const EVENT_CATEGORIES = [
  { value: 'samtal', label: 'Samtal' },
  { value: 'mote', label: 'Möte' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'lansering', label: 'Lansering' },
  { value: 'paminnelse', label: 'Påminnelse' },
  { value: 'annat', label: 'Annat' }
];

const PRIORITIES = [
  { value: 'low', label: 'Låg' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'Hög' }
];

const DURATIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 timme' },
  { value: 90, label: '1.5 timme' },
  { value: 120, label: '2 timmar' },
  { value: 180, label: '3 timmar' },
  { value: 240, label: '4 timmar' },
  { value: 480, label: 'Heldag' }
];

export const AddEventForm = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  clientId,
  initialDate = new Date(),
  onSuccess
}: AddEventFormProps) => {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    date: Date;
    time: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    duration: number;
    visibleToClient: boolean;
  }>({
    title: '',
    description: '',
    date: initialDate,
    time: '09:00',
    category: '',
    priority: 'medium',
    duration: 60,
    visibleToClient: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;

    // Combine date and time
    const [hours, minutes] = formData.time.split(':').map(Number);
    const eventDate = new Date(formData.date);
    eventDate.setHours(hours, minutes, 0, 0);

    const eventData: Partial<CalendarEventData> = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      date: eventDate,
      category: formData.category || undefined,
      priority: formData.priority,
      duration: formData.duration,
      user_id: clientId,
      metadata: {
        visible_to_client: formData.visibleToClient,
        created_by_role: 'admin' // Should get from auth context
      }
    };

    onAdd(eventData);
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      date: initialDate,
      time: '09:00',
      category: '',
      priority: 'medium',
      duration: 60,
      visibleToClient: false
    });
    
    // Trigger refresh of parent components
    onSuccess?.();
    onClose();
  };

  const handleCancel = () => {
    setFormData({
      title: '',
      description: '',
      date: initialDate,
      time: '09:00',
      category: '',
      priority: 'medium',
      duration: 60,
      visibleToClient: false
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Lägg till händelse</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Titel <span className="text-destructive">*</span>
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Möte med coach"
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
              placeholder="Valfri beskrivning av händelsen..."
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
                    className="pointer-events-auto"
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

          {/* Category and Priority */}
          <div className="grid grid-cols-2 gap-4">
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
                  {EVENT_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Prioritet</label>
              <Select 
                value={formData.priority} 
                onValueChange={(value: 'low' | 'medium' | 'high') => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Visibility checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="visibleToClient"
              checked={formData.visibleToClient}
              onChange={(e) => setFormData(prev => ({ ...prev, visibleToClient: e.target.checked }))}
              className="rounded border-input"
            />
            <label htmlFor="visibleToClient" className="text-sm font-medium">
              Visa även för klienten?
            </label>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Information:</strong> Händelsen sparas som standard som intern och är endast synlig för administratörer och managers. 
              Markera checkboxen ovan om klienten också ska kunna se denna händelse.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Varaktighet</label>
            <Select 
              value={formData.duration.toString()} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map((duration) => (
                  <SelectItem key={duration.value} value={duration.value.toString()}>
                    {duration.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Lägg till händelse
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Avbryt
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};