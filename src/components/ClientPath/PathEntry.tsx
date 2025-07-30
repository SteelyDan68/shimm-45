import { useState } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  CheckCircle2, 
  Clock, 
  PlayCircle,
  FileText,
  Brain,
  Target,
  MessageSquare,
  Users
} from 'lucide-react';
import type { PathEntry, PathEntryType, PathEntryStatus } from '@/types/clientPath';

interface PathEntryProps {
  entry: PathEntry;
  onUpdate: (id: string, updates: Partial<PathEntry>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

const typeIcons: Record<PathEntryType, any> = {
  assessment: FileText,
  recommendation: Brain,
  action: Target,
  note: MessageSquare,
  'check-in': Users
};

const typeLabels: Record<PathEntryType, string> = {
  assessment: 'Bedömning',
  recommendation: 'Rekommendation',
  action: 'Åtgärd',
  note: 'Anteckning',
  'check-in': 'Check-in'
};

const statusLabels: Record<PathEntryStatus, string> = {
  planned: 'Planerad',
  in_progress: 'Pågår',
  completed: 'Klar'
};

const statusColors: Record<PathEntryStatus, string> = {
  planned: 'bg-yellow-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500'
};

const statusIcons: Record<PathEntryStatus, any> = {
  planned: Clock,
  in_progress: PlayCircle,
  completed: CheckCircle2
};

export function PathEntry({ entry, onUpdate, onDelete }: PathEntryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(entry.title);
  const [editDetails, setEditDetails] = useState(entry.details || '');
  const [editStatus, setEditStatus] = useState(entry.status);
  const [isLoading, setIsLoading] = useState(false);

  const TypeIcon = typeIcons[entry.type];
  const StatusIcon = statusIcons[entry.status];

  const handleSave = async () => {
    setIsLoading(true);
    const success = await onUpdate(entry.id, {
      title: editTitle,
      details: editDetails,
      status: editStatus
    });
    
    if (success) {
      setIsEditing(false);
    }
    setIsLoading(false);
  };

  const handleCancel = () => {
    setEditTitle(entry.title);
    setEditDetails(entry.details || '');
    setEditStatus(entry.status);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Är du säker på att du vill radera denna post?')) {
      setIsLoading(true);
      await onDelete(entry.id);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-4 relative">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${statusColors[entry.status]} mt-6`} />
        <div className="w-px bg-border flex-1 mt-2" />
      </div>

      {/* Entry content */}
      <div className="flex-1 pb-8">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <TypeIcon className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="text-xs">
                    {typeLabels[entry.type]}
                  </Badge>
                  {entry.ai_generated && (
                    <Badge variant="secondary" className="text-xs">
                      <Brain className="h-3 w-3 mr-1" />
                      AI
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon className="h-4 w-4 text-muted-foreground" />
                  <Badge 
                    variant="secondary" 
                    className={`text-white text-xs ${statusColors[entry.status]}`}
                  >
                    {statusLabels[entry.status]}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(entry.timestamp), 'PPp', { locale: sv })}
                </span>
                {!isEditing && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      disabled={isLoading}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-3 mt-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Titel"
                />
                <Select value={editStatus} onValueChange={(value: PathEntryStatus) => setEditStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md">
                    <SelectItem value="planned">Planerad</SelectItem>
                    <SelectItem value="in_progress">Pågår</SelectItem>
                    <SelectItem value="completed">Klar</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={isLoading} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Spara
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Avbryt
                  </Button>
                </div>
              </div>
            ) : (
              <CardTitle className="text-lg mt-2">{entry.title}</CardTitle>
            )}
          </CardHeader>

          {(entry.details || isEditing) && (
            <CardContent className="pt-0">
              {isEditing ? (
                <Textarea
                  value={editDetails}
                  onChange={(e) => setEditDetails(e.target.value)}
                  placeholder="Detaljer (valfritt)"
                  rows={3}
                />
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {entry.details}
                </p>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}