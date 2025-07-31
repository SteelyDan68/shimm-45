import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Save, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClientPath } from '@/hooks/useClientPath';
import { useToast } from '@/hooks/use-toast';
import { CreatePathEntryData } from '@/types/clientPath';

interface ManualNoteFormProps {
  clientId: string;
}

const NOTE_TYPES = [
  { value: 'observation', label: 'Observation' },
  { value: 'call_reflection', label: 'Samtalsreflektion' },
  { value: 'internal_note', label: 'Intern notering' },
  { value: 'progress_note', label: 'Utvecklingsnotering' },
  { value: 'meeting_summary', label: 'Mötessammanfattning' }
];

export const ManualNoteForm = ({ clientId }: ManualNoteFormProps) => {
  const { user } = useAuth();
  const { createEntry } = useClientPath(clientId);
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    noteType: '',
    visibleToClient: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.noteType) {
      toast({
        title: "Fyll i alla obligatoriska fält",
        description: "Titel, innehåll och typ måste fyllas i.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const entryData: CreatePathEntryData = {
        user_id: clientId,
        type: 'manual_note',
        title: formData.title.trim(),
        content: formData.content.trim(),
        details: `Typ: ${NOTE_TYPES.find(t => t.value === formData.noteType)?.label}`,
        status: 'completed',
        ai_generated: false,
        visible_to_client: formData.visibleToClient,
        created_by_role: 'admin', // Should be derived from user's actual role
        metadata: {
          note_type: formData.noteType,
          visibility: formData.visibleToClient ? 'shared' : 'internal'
        }
      };

      const result = await createEntry(entryData);
      
      if (result) {
        toast({
          title: "Journalanteckning sparad",
          description: `Anteckningen "${formData.title}" har lagts till i tidslinjen.`
        });
        
        // Reset form
        setFormData({
          title: '',
          content: '',
          noteType: '',
          visibleToClient: false
        });
        
        setIsOpen(false);
      } else {
        throw new Error('Failed to create entry');
      }
    } catch (error) {
      console.error('Error creating manual note:', error);
      toast({
        title: "Fel vid sparande",
        description: "Kunde inte spara journalanteckningen. Försök igen.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: '',
      content: '',
      noteType: '',
      visibleToClient: false
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <PlusCircle className="h-4 w-4 mr-2" />
          Ny journalanteckning
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Skapa journalanteckning
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Rubrik <span className="text-destructive">*</span>
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Första uppföljningssamtalet"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="noteType" className="text-sm font-medium">
              Typ av anteckning <span className="text-destructive">*</span>
            </label>
            <Select
              value={formData.noteType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, noteType: value }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj typ av anteckning" />
              </SelectTrigger>
              <SelectContent>
                {NOTE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              Innehåll <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Skriv din journalanteckning här..."
              rows={8}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="visibleToClient"
              checked={formData.visibleToClient}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, visibleToClient: checked as boolean }))
              }
              disabled={isLoading}
            />
            <label htmlFor="visibleToClient" className="text-sm font-medium">
              Visa även för klienten?
            </label>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Information:</strong> Anteckningen sparas som standard som intern och är endast synlig för administratörer och managers. 
              Markera checkboxen ovan om klienten också ska kunna se denna anteckning i sin tidslinje.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Sparar...' : 'Spara anteckning'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Avbryt
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};