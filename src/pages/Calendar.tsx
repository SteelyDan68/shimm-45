import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Clock, Users, Plus, ArrowLeft, Video, Phone, Coffee, 
         Edit, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/UnifiedAuthProvider';
import { useEnhancedStefanContext } from '@/providers/EnhancedStefanContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { CalendarView } from '@/components/Calendar/CalendarView';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  category: string;
  created_by: string;
  created_by_role: string;
  visible_to_client: boolean;
  user_id?: string;
}

export function CalendarPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { triggerContextualHelp } = useEnhancedStefanContext();
  
  const action = searchParams.get('action');
  const isScheduling = action === 'schedule';
  
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: undefined as Date | undefined,
    time: '10:00',
    duration: '60',
    category: 'coaching' as string,
    user_id: '',
    visible_to_client: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.event_date) {
      toast({
        title: "Validering misslyckades",
        description: "Titel och datum krävs",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Combine date and time
      const [hours, minutes] = formData.time.split(':');
      const eventDateTime = new Date(formData.event_date);
      eventDateTime.setHours(parseInt(hours), parseInt(minutes));

      const { error } = await supabase
        .from('calendar_events')
        .insert({
          title: formData.title,
          description: formData.description,
          event_date: eventDateTime.toISOString(),
          category: formData.category,
          user_id: formData.user_id || user?.id,
          created_by: user?.id,
          created_by_role: 'coach',
          visible_to_client: formData.visible_to_client
        });

      if (error) throw error;

      toast({
        title: "Möte schemalagt",
        description: "Mötet har schemalagts framgångsrikt",
      });

      // Trigger Stefan acknowledgment for event creation
      await triggerContextualHelp('event_scheduled', { 
        event_title: formData.title,
        event_date: eventDateTime.toISOString()
      });

      navigate('/coach');
    } catch (error) {
      console.error('Error creating calendar event:', error);
      toast({
        title: "Fel",
        description: "Kunde inte schemalägga mötet",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (isScheduling) {
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
            <h1 className="text-2xl font-bold">Schemalägg möte</h1>
            <p className="text-muted-foreground">Boka tid med klient eller för egen planering</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Nytt möte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Mötestitel *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="T.ex. Coaching-session med..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beskrivning</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Agenda, förberedelser eller andra detaljer..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Datum *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.event_date ? (
                          format(formData.event_date, 'PPP', { locale: sv })
                        ) : (
                          <span>Välj datum</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.event_date}
                        onSelect={(date) => setFormData(prev => ({ ...prev, event_date: date }))}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Tid</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Varaktighet (min)</Label>
                  <Select 
                    value={formData.duration} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minuter</SelectItem>
                      <SelectItem value="45">45 minuter</SelectItem>
                      <SelectItem value="60">60 minuter</SelectItem>
                      <SelectItem value="90">90 minuter</SelectItem>
                      <SelectItem value="120">2 timmar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mötestyp</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coaching">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Coaching-session
                      </div>
                    </SelectItem>
                    <SelectItem value="video_call">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Videosamtal
                      </div>
                    </SelectItem>
                    <SelectItem value="phone_call">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Telefonsamtal
                      </div>
                    </SelectItem>
                    <SelectItem value="coffee_meeting">
                      <div className="flex items-center gap-2">
                        <Coffee className="h-4 w-4" />
                        Fika/möte
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

                <div className="space-y-2">
                  <Label htmlFor="user_id">Klient (valfritt)</Label>
                  <Input
                    id="user_id"
                    value={formData.user_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, user_id: e.target.value }))}
                    placeholder="Användar-ID eller e-post"
                />
                <p className="text-xs text-muted-foreground">
                  Lämna tomt för personlig planering
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="visible_to_client"
                  checked={formData.visible_to_client}
                  onChange={(e) => setFormData(prev => ({ ...prev, visible_to_client: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="visible_to_client" className="text-sm">
                  Synlig för klient (om klient anges)
                </Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Schemalägger...' : 'Schemalägg möte'}
                  <CalendarIcon className="ml-2 h-4 w-4" />
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

  const handleCreateEvent = (date?: Date) => {
    if (date) {
      setFormData(prev => ({ ...prev, event_date: date }));
    }
    setSearchParams({ action: 'schedule' });
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Händelse borttagen",
        description: "Kalenderhändelsen har tagits bort",
      });

      setShowEventDialog(false);
      setSelectedEvent(null);
      // Trigger calendar refresh by updating search params
      setSearchParams({});
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort händelsen",
        variant: "destructive"
      });
    }
  };

  // Default calendar overview page
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-8 w-8 text-primary" />
            Kalender
          </h1>
          <p className="text-muted-foreground">
            Översikt och hantering av möten och scheman
          </p>
        </div>
      </div>

      <CalendarView 
        onCreateEvent={handleCreateEvent}
        onEventClick={handleEventClick}
      />

      {/* Event Details Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Händelsedetaljer
            </DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedEvent.title}</h3>
                {selectedEvent.description && (
                  <p className="text-muted-foreground mt-1">{selectedEvent.description}</p>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(selectedEvent.event_date), 'PPPp', { locale: sv })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{selectedEvent.category.replace('_', ' ')}</span>
                </div>

                {selectedEvent.user_id && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Kopplad till klient</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Pre-fill form with existing event data for editing
                    const eventDate = new Date(selectedEvent.event_date);
                    setFormData({
                      title: selectedEvent.title,
                      description: selectedEvent.description || '',
                      event_date: eventDate,
                      time: format(eventDate, 'HH:mm'),
                      duration: '60', // Default, could be stored in DB
                      category: selectedEvent.category,
                      user_id: selectedEvent.user_id || '',
                      visible_to_client: selectedEvent.visible_to_client
                    });
                    setShowEventDialog(false);
                    setSearchParams({ action: 'schedule', edit: selectedEvent.id });
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Redigera
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Ta bort
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}