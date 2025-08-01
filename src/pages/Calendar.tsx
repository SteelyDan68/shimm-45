import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Clock, Users, Plus, ArrowLeft, Video, Phone, Coffee } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export function CalendarPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const action = searchParams.get('action');
  const isScheduling = action === 'schedule';
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: undefined as Date | undefined,
    time: '10:00',
    duration: '60',
    category: 'coaching' as string,
    client_id: '',
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
          user_id: formData.client_id || user?.id,
          created_by: user?.id,
          created_by_role: 'coach',
          visible_to_client: formData.visible_to_client
        });

      if (error) throw error;

      toast({
        title: "Möte schemalagt",
        description: "Mötet har schemalagts framgångsrikt",
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
                <Label htmlFor="client_id">Klient (valfritt)</Label>
                <Input
                  id="client_id"
                  value={formData.client_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                  placeholder="Klient-ID eller e-post"
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

  // Default calendar overview page
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Kalender</h1>
          <p className="text-muted-foreground">Hantera möten och scheman</p>
        </div>
        <Button onClick={() => navigate('/calendar?action=schedule')}>
          <Plus className="mr-2 h-4 w-4" />
          Schemalägg möte
        </Button>
      </div>

      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Kalendervy kommer snart</h3>
            <p className="text-muted-foreground mb-4">
              Här kommer du att kunna se alla schemalagda möten.
            </p>
            <Button onClick={() => navigate('/calendar?action=schedule')}>
              Schemalägg ditt första möte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}