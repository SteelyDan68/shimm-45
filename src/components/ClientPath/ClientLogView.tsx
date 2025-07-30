import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar as CalendarIcon,
  Eye,
  Shield,
  FileText,
  Brain,
  CheckCircle2,
  Users,
  Target,
  Edit3,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useClientPath } from '@/hooks/useClientPath';
import { PathEntry, PathEntryType } from '@/types/clientPath';
import { cn } from '@/lib/utils';

interface ClientLogViewProps {
  clientId: string;
  clientName: string;
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_CONFIG = {
  manual_note: { name: 'Journalanteckning', color: 'bg-blue-500', icon: Edit3 },
  recommendation: { name: 'AI-rekommendation', color: 'bg-green-500', icon: Brain },
  assessment: { name: 'Bedömning', color: 'bg-purple-500', icon: FileText },
  task_completed: { name: 'Genomfört', color: 'bg-emerald-500', icon: CheckCircle2 },
  'check-in': { name: 'Check-in', color: 'bg-orange-500', icon: Users },
  summary: { name: 'Summering', color: 'bg-gray-500', icon: Target },
  action: { name: 'Åtgärd', color: 'bg-red-500', icon: Target },
  note: { name: 'Anteckning', color: 'bg-yellow-500', icon: FileText },
};

const ROLE_LABELS = {
  superadmin: 'Superadministratör',
  admin: 'Administratör', 
  manager: 'Manager',
  user: 'Användare',
  client: 'Klient'
};

export const ClientLogView = ({ clientId, clientName, isOpen, onClose }: ClientLogViewProps) => {
  const { entries } = useClientPath(clientId);
  const [selectedEntry, setSelectedEntry] = useState<PathEntry | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<PathEntryType | 'all'>('all');
  const [authorFilter, setAuthorFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'shared' | 'internal'>('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesTitle = entry.title.toLowerCase().includes(searchLower);
        const matchesContent = (entry.content || entry.details || '').toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesContent) return false;
      }

      // Type filter
      if (typeFilter !== 'all' && entry.type !== typeFilter) return false;

      // Author role filter
      if (authorFilter !== 'all' && entry.created_by_role !== authorFilter) return false;

      // Visibility filter
      if (visibilityFilter !== 'all') {
        if (visibilityFilter === 'shared' && !entry.visible_to_client) return false;
        if (visibilityFilter === 'internal' && entry.visible_to_client) return false;
      }

      // Date range filter
      const entryDate = new Date(entry.timestamp);
      if (startDate && entryDate < startDate) return false;
      if (endDate && entryDate > endDate) return false;

      return true;
    });
  }, [entries, searchTerm, typeFilter, authorFilter, visibilityFilter, startDate, endDate]);

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setAuthorFilter('all');
    setVisibilityFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const exportToCsv = () => {
    const headers = ['Datum', 'Typ', 'Titel', 'Innehåll', 'Författare', 'Synlighet'];
    const csvData = filteredEntries.map(entry => [
      format(new Date(entry.timestamp), 'yyyy-MM-dd HH:mm'),
      TYPE_CONFIG[entry.type]?.name || entry.type,
      entry.title,
      (entry.content || entry.details || '').replace(/"/g, '""'),
      ROLE_LABELS[entry.created_by_role as keyof typeof ROLE_LABELS] || entry.created_by_role,
      entry.visible_to_client ? 'Delad' : 'Intern'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${clientName}_logg_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Journallogg - {clientName}
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 p-4 border rounded-lg">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök i titel och innehåll..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Type filter */}
          <Select value={typeFilter} onValueChange={(value: PathEntryType | 'all') => setTypeFilter(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Alla typer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla typer</SelectItem>
              {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Author filter */}
          <Select value={authorFilter} onValueChange={setAuthorFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Alla författare" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla författare</SelectItem>
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Visibility filter */}
          <Select value={visibilityFilter} onValueChange={(value: 'all' | 'shared' | 'internal') => setVisibilityFilter(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Alla synligheter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla synligheter</SelectItem>
              <SelectItem value="shared">Delad med klient</SelectItem>
              <SelectItem value="internal">Endast intern</SelectItem>
            </SelectContent>
          </Select>

          {/* Date filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'PP', { locale: sv }) : 'Från datum'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <div className="flex gap-2">
            <Button onClick={clearFilters} variant="outline" size="sm">
              <X className="h-4 w-4 mr-1" />
              Rensa
            </Button>
            <Button onClick={exportToCsv} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-2 p-4">
            <div className="text-sm text-muted-foreground mb-4">
              Visar {filteredEntries.length} av {entries.length} poster
            </div>

            {filteredEntries.map((entry) => {
              const TypeIcon = TYPE_CONFIG[entry.type]?.icon || FileText;
              const typeConfig = TYPE_CONFIG[entry.type];

              return (
                <Card 
                  key={entry.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Type indicator */}
                      <div className={cn("w-1 h-full min-h-[60px] rounded", typeConfig?.color)} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <TypeIcon className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline">{typeConfig?.name}</Badge>
                          {entry.visible_to_client ? (
                            <Badge className="bg-green-100 text-green-800">
                              <Eye className="h-3 w-3 mr-1" />
                              Delad
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Shield className="h-3 w-3 mr-1" />
                              Intern
                            </Badge>
                          )}
                        </div>
                        
                        <h4 className="font-medium truncate">{entry.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {entry.content || entry.details}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{format(new Date(entry.timestamp), 'PP', { locale: sv })}</span>
                          <span>•</span>
                          <span>{ROLE_LABELS[entry.created_by_role as keyof typeof ROLE_LABELS] || entry.created_by_role}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredEntries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Inga poster matchar dina filter.</p>
              </div>
            )}
          </div>
        </div>

        {/* Entry Details Dialog */}
        {selectedEntry && (
          <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedEntry.title}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {TYPE_CONFIG[selectedEntry.type]?.name}
                  </Badge>
                  {selectedEntry.visible_to_client ? (
                    <Badge className="bg-green-100 text-green-800">
                      <Eye className="h-3 w-3 mr-1" />
                      Synlig för klient
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Shield className="h-3 w-3 mr-1" />
                      Endast intern
                    </Badge>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  {format(new Date(selectedEntry.timestamp), 'PPpp', { locale: sv })} • 
                  {ROLE_LABELS[selectedEntry.created_by_role as keyof typeof ROLE_LABELS] || selectedEntry.created_by_role}
                </div>

                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap">
                    {selectedEntry.content || selectedEntry.details}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};