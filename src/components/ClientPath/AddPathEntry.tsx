import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import type { PathEntryType, PathEntryStatus, CreatePathEntryData } from '@/types/clientPath';

interface AddPathEntryProps {
  clientId: string;
  onAdd: (entryData: CreatePathEntryData) => Promise<any>;
}

export function AddPathEntry({ clientId, onAdd }: AddPathEntryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'note' as PathEntryType,
    title: '',
    details: '',
    status: 'planned' as PathEntryStatus,
    timestamp: new Date()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsLoading(true);
    try {
      await onAdd({
        client_id: clientId,
        type: formData.type,
        title: formData.title.trim(),
        details: formData.details.trim() || undefined,
        status: formData.status,
        timestamp: formData.timestamp.toISOString(),
        ai_generated: false
      });

      // Reset form
      setFormData({
        type: 'note',
        title: '',
        details: '',
        status: 'planned',
        timestamp: new Date()
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding path entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Lägg till post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Lägg till timeline-post</DialogTitle>
          <DialogDescription>
            Skapa en ny post i klientens resa
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Typ</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: PathEntryType) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md">
                  <SelectItem value="assessment">Bedömning</SelectItem>
                  <SelectItem value="recommendation">Rekommendation</SelectItem>
                  <SelectItem value="action">Åtgärd</SelectItem>
                  <SelectItem value="note">Anteckning</SelectItem>
                  <SelectItem value="check-in">Check-in</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: PathEntryStatus) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md">
                  <SelectItem value="planned">Planerad</SelectItem>
                  <SelectItem value="in_progress">Pågår</SelectItem>
                  <SelectItem value="completed">Klar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="timestamp">Datum & tid</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(formData.timestamp, 'PPp', { locale: sv })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background border shadow-md" align="start">
                <Calendar
                  mode="single"
                  selected={formData.timestamp}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, timestamp: date }))}
                  initialFocus
                />
                <div className="p-3 border-t">
                  <input
                    type="time"
                    value={format(formData.timestamp, 'HH:mm')}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':');
                      const newDate = new Date(formData.timestamp);
                      newDate.setHours(parseInt(hours), parseInt(minutes));
                      setFormData(prev => ({ ...prev, timestamp: newDate }));
                    }}
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Beskriv kort vad som hände..."
              required
            />
          </div>

          <div>
            <Label htmlFor="details">Detaljer (valfritt)</Label>
            <Textarea
              id="details"
              value={formData.details}
              onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
              placeholder="Lägg till mer information..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isLoading || !formData.title.trim()}>
              {isLoading ? 'Sparar...' : 'Skapa post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}