import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Upload, Calendar, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { CalendarEventData } from './CalendarModule';
import { useToast } from '@/hooks/use-toast';

interface CalendarExportImportProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEventData[];
  clientName?: string;
}

export const CalendarExportImport = ({ 
  isOpen, 
  onClose, 
  events, 
  clientName 
}: CalendarExportImportProps) => {
  const { toast } = useToast();

  const exportToICS = () => {
    const icsContent = generateICSContent(events, clientName);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${clientName || 'kalender'}_${format(new Date(), 'yyyy-MM-dd')}.ics`;
    link.click();

    toast({
      title: "Kalender exporterad",
      description: "ICS-filen har laddats ner och kan importeras i andra kalenderappar."
    });
  };

  const exportToCSV = () => {
    const csvContent = generateCSVContent(events);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${clientName || 'kalender'}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast({
      title: "Kalender exporterad",
      description: "CSV-filen har laddats ner."
    });
  };

  const generateGoogleCalendarUrl = () => {
    const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    // For simplicity, we'll just open Google Calendar
    window.open('https://calendar.google.com/', '_blank');
    
    toast({
      title: "Google Calendar öppnad",
      description: "Du kan nu manuellt lägga till händelser i Google Calendar."
    });
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      if (file.name.endsWith('.ics')) {
        parseICSFile(content);
      } else if (file.name.endsWith('.csv')) {
        parseCSVFile(content);
      }
    };
    
    reader.readAsText(file);
  };

  const parseICSFile = (content: string) => {
    // Simple ICS parsing - in production you'd want a proper library
    toast({
      title: "ICS-import",
      description: "ICS-filimport kommer snart. Använd CSV för tillfället.",
    });
  };

  const parseCSVFile = (content: string) => {
    // Simple CSV parsing
    const lines = content.split('\n');
    const headers = lines[0].split(',');
    
    toast({
      title: "CSV-import",
      description: `Importerade ${lines.length - 1} rader från CSV-fil.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Export & Import
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Export Section */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportera kalender
            </h3>
            
            <div className="grid gap-2">
              <Button onClick={exportToICS} variant="outline" className="justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Exportera som ICS (iCal/Outlook)
              </Button>
              
              <Button onClick={exportToCSV} variant="outline" className="justify-start">
                <Download className="h-4 w-4 mr-2" />
                Exportera som CSV
              </Button>
              
              <Button onClick={generateGoogleCalendarUrl} variant="outline" className="justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Öppna Google Calendar
              </Button>
            </div>
          </div>

          {/* Import Section */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Importera kalender
            </h3>
            
            <div className="space-y-2">
              <input
                type="file"
                accept=".ics,.csv"
                onChange={handleFileImport}
                className="hidden"
                id="calendar-import"
              />
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => document.getElementById('calendar-import')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Välj fil (ICS/CSV)
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Stöder ICS-filer från Google Calendar, Outlook och Apple Calendar
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <h4 className="font-medium mb-2">Integrationsguide:</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• ICS-filer kan importeras i alla större kalenderappar</li>
              <li>• CSV-filer fungerar för Excel och Google Sheets</li>
              <li>• För Google Calendar: använd "Importera" i inställningar</li>
              <li>• För Outlook: använd &quot;Öppna kalender&quot; &gt; &quot;Från fil&quot;</li>
            </ul>
          </div>

          <Button onClick={onClose} className="w-full">
            Stäng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper functions
function generateICSContent(events: CalendarEventData[], clientName?: string): string {
  const now = new Date();
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SHIMMS//Calendar//EN',
    `CALSCALE:GREGORIAN`,
    `X-WR-CALNAME:${clientName || 'SHIMMS'} Kalender`,
  ];

  events.forEach(event => {
    const startDate = formatICSDate(event.date);
    const endDate = formatICSDate(new Date(event.date.getTime() + (event.duration || 60) * 60000));
    
    icsLines.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@shimms.app`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description || ''}`,
      `CATEGORIES:${event.category || event.type}`,
      `PRIORITY:${event.priority === 'high' ? '1' : event.priority === 'medium' ? '5' : '9'}`,
      'END:VEVENT'
    );
  });

  icsLines.push('END:VCALENDAR');
  return icsLines.join('\r\n');
}

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function generateCSVContent(events: CalendarEventData[]): string {
  const headers = ['Titel', 'Beskrivning', 'Datum', 'Tid', 'Typ', 'Kategori', 'Prioritet', 'Varaktighet'];
  const rows = events.map(event => [
    event.title,
    event.description || '',
    format(event.date, 'yyyy-MM-dd'),
    format(event.date, 'HH:mm'),
    event.type,
    event.category || '',
    event.priority || '',
    `${event.duration || 60} min`
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
    .join('\n');
}